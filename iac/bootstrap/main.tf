locals {
  ssm_parameters = {
    for pair in setproduct(var.stages, var.ssm_parameter_keys) : "${pair[0]}/${pair[1]}" => {
      stage = pair[0]
      key   = pair[1]
    }
  }
}

data "aws_caller_identity" "current" {}

resource "aws_ssm_parameter" "app_config" {
  for_each = local.ssm_parameters

  name  = "/${var.amplify_app_name}/${each.value.stage}/${each.value.key}"
  type  = "SecureString"
  value = "CHANGE_ME"

  # Real values are filled in out-of-band, directly in AWS (see this
  # directory's README, "How to run" step 6), never through this file.
  # Without this, any later `apply` (e.g. adding a new IAM resource) would
  # see the live value drifted from the "CHANGE_ME" placeholder above and
  # revert it — silently destroying a real secret.
  lifecycle {
    ignore_changes = [value]
  }
}

locals {
  # Read+decrypt every app parameter, for every stage. Shared by both Amplify
  # roles below, and shared across stages because a single Amplify app serves
  # both branches.
  amplify_ssm_read_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadAppConfigParameters"
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath",
        ]
        Resource = flatten([
          for stage in var.stages : [
            "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.amplify_app_name}/${stage}",
            "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.amplify_app_name}/${stage}/*"
            ]
        ])
      },
      {
        Sid      = "DecryptAppConfigParameters"
        Effect   = "Allow"
        Action   = "kms:Decrypt"
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "ssm.${var.aws_region}.amazonaws.com"
          }
        }
      }
    ]
  })
}

# THE role that `amplify.yml`'s preBuild runs as. This is the only attribute
# that gives the Amplify *build container* an identity inside this account:
# without it the container falls back to an Amplify-service-owned role in an
# AWS-owned account (`arn:aws:sts::073653171576:assumed-role/Aemilia...`),
# which no policy written here could ever grant SSM access to — SSM Parameter
# Store has no resource-based policies — that is how this fails in practice,
# with AccessDeniedException on ssm:GetParametersByPath.
#
# Do not collapse this into amplify_compute below: they are deliberately
# distinct trust boundaries. This one is handed to a container running
# arbitrary code from the repository, the other to the SSR runtime.
resource "aws_iam_role" "amplify_service" {
  name = "${var.amplify_app_name}-amplify-service"

  # The Condition block is the confused-deputy guard AWS enforces by default
  # on this role's trust policy: without it, an Amplify app in *any* account
  # could ask Amplify to assume this role on its behalf. The ARN is a
  # wildcard over this account's apps rather than this one app because the
  # app resource references this role — pinning the app id here would be a
  # Terraform dependency cycle.
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "amplify.amazonaws.com" }
      Action    = "sts:AssumeRole"
      Condition = {
        StringEquals = { "aws:SourceAccount" = data.aws_caller_identity.current.account_id }
        ArnLike      = { "aws:SourceArn" = "arn:aws:amplify:${var.aws_region}:${data.aws_caller_identity.current.account_id}:apps/*" }
      }
    }]
  })
}

resource "aws_iam_role_policy" "amplify_service_ssm" {
  name   = "ssm-read-app-config"
  role   = aws_iam_role.amplify_service.id
  policy = local.amplify_ssm_read_policy
}

# Assumed by Amplify's SSR compute at *runtime only* — AWS documents it as
# "called only from SSR compute functions", so it is never the identity the
# build sees. compute_role_arn is an aws_amplify_app-level
# attribute, not per-branch, so this single role necessarily covers both
# stage paths.
resource "aws_iam_role" "amplify_compute" {
  name = "${var.amplify_app_name}-amplify-compute"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "amplify.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "amplify_compute_ssm" {
  name   = "ssm-read-app-config"
  role   = aws_iam_role.amplify_compute.id
  policy = local.amplify_ssm_read_policy
}

# IAM roles aren't immediately assumable by other services' control planes
# right after creation (well-known cross-service propagation delay). Without
# this, Amplify's UpdateApp call can race role creation and fail with
# "The compute role provided cannot be assumed by Amplify" even though the
# trust policy is correct.
resource "time_sleep" "wait_for_amplify_roles" {
  depends_on = [
    aws_iam_role_policy.amplify_service_ssm,
    aws_iam_role_policy.amplify_compute_ssm,
  ]

  create_duration = "15s"
}

resource "aws_amplify_app" "this" {
  name         = var.amplify_app_name
  repository   = var.github_repository_url
  access_token = var.github_access_token

  # Build-time identity (amplify.yml preBuild) and runtime identity (SSR
  # compute) are two different attributes, and only the first one affects
  # the build. Setting compute_role_arn alone leaves the build container on
  # an Amplify-owned role in an AWS-owned account.
  iam_service_role_arn = aws_iam_role.amplify_service.arn
  compute_role_arn     = aws_iam_role.amplify_compute.arn

  # This is an SSR app (Server Actions, app/api route handlers) — AWS
  # requires WEB_COMPUTE for that, not the WEB (static) default this
  # resource otherwise gets.
  platform = "WEB_COMPUTE"

  depends_on = [time_sleep.wait_for_amplify_roles]
}

resource "aws_amplify_branch" "prod" {
  app_id            = aws_amplify_app.this.id
  branch_name       = "prod"
  stage             = "PRODUCTION"
  enable_auto_build = false

  # STAGE/SSM_PATH are set out-of-band by cd.yml's `update-branch` call
  # before every deploy, never by this file. Without this,
  # Terraform's refresh sees that live drift against its unset/null config
  # and tries to clear it back out on every apply — which the Amplify API
  # rejects ("Environment variables cannot have an empty key") instead of
  # silently wiping cd.yml's values.
  lifecycle {
    ignore_changes = [environment_variables]
  }
}

resource "aws_amplify_branch" "homol" {
  app_id            = aws_amplify_app.this.id
  branch_name       = "homol"
  stage             = "BETA"
  enable_auto_build = false

  lifecycle {
    ignore_changes = [environment_variables]
  }
}
