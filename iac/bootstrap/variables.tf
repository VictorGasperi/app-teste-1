variable "aws_region" {
  description = "AWS region where every resource (SSM parameters, Amplify app) is created. No default — must be passed explicitly (-var or TF_VAR_aws_region)."
  type        = string
}

variable "amplify_app_name" {
  description = "Name of the Amplify app, also used as the SSM parameter path prefix (/<amplify_app_name>/<stage>/<KEY>). Must match vars.AMPLIFY_APP_NAME configured in GitHub for cd.yml."
  type        = string
  default     = "CHANGE_ME_APP_NAME"

  validation {
    condition     = var.amplify_app_name != "CHANGE_ME_APP_NAME"
    error_message = "amplify_app_name must be edited from its placeholder default before running apply."
  }
}

variable "stages" {
  description = "Stages that receive the full SSM parameter tree."
  type        = list(string)
  default     = ["homol", "prod"]
}

variable "ssm_parameter_keys" {
  description = "Runtime configuration keys mirrored from .env.example — every key except STAGE, which cannot be resolved via SSM before the stage itself is known. Add a key here whenever you add one to .env.example; a key present in .env.example but missing here will be absent at runtime in homol/prod."
  type        = list(string)
  default = [
    "DATABASE_URL",
    "APP_BASE_URL",
  ]
}

variable "github_repository_url" {
  description = "Git URL of the GitHub repository the Amplify app connects to (e.g. https://github.com/your-org/your-repo). No default — must be passed explicitly."
  type        = string
}

variable "github_access_token" {
  description = "GitHub Personal Access Token used by Amplify to connect to the repository. No default — must be passed via TF_VAR_github_access_token (or -var), never committed."
  type        = string
  sensitive   = true
}
