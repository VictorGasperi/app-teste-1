output "ssm_parameter_names" {
  description = "Full SSM paths created for every stage/key combination (names only, no values)."
  value       = [for p in aws_ssm_parameter.app_config : p.name]
}

output "amplify_app_id" {
  description = "ID of the Amplify app created."
  value       = aws_amplify_app.this.id
}

output "amplify_default_domain" {
  description = "Default domain of the Amplify app created."
  value       = aws_amplify_app.this.default_domain
}

output "amplify_build_identity_role_arn" {
  description = "ARN of the role the Amplify build container runs as; compare it against the ARN printed by amplify.yml's preBuild to confirm the build is not falling back to an Amplify-owned role."
  value       = aws_iam_role.amplify_service.arn
}

output "amplify_branch_names" {
  description = "Names of the Amplify branches created."
  value       = [aws_amplify_branch.prod.branch_name, aws_amplify_branch.homol.branch_name]
}
