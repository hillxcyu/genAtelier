variable "project_id" {
  type        = string
  description = "The GCP Project ID where the demo resources will be deployed."
}

variable "project_name" {
  type        = string
  description = "The human-readable GCP Project Name."
  default     = ""
}

variable "project_number" {
  type        = string
  description = "The numeric GCP Project Number."
  default     = ""
}

variable "org_id" {
  type        = string
  description = "The GCP Organization ID."
  default     = ""
}

variable "gcp_account_name" {
  type        = string
  description = "The user account email triggering the Click-to-Deploy run."
  default     = ""
}

variable "deployment_service_account_name" {
  type        = string
  description = "The service account used by the Demo Automation Platform to execute Terraform."
  default     = ""
}

variable "data_location" {
  type        = string
  description = "Default region or multi-region for data and compute resources."
  default     = "us-central1"
}

variable "secret_stored_project" {
  type        = string
  description = "The GCP project ID where demo secrets are stored."
  default     = ""
}

variable "service_name" {
  type        = string
  description = "Cloud Run service name and prefix for load-balancer resources."
  default     = "gen-fashion-atelier"
}

variable "artifact_repo" {
  type        = string
  description = "Artifact Registry Docker repository ID."
  default     = "gen-fashion-atelier"
}

variable "app_image" {
  type        = string
  description = "Container image URI for the main application container. Defaults to the project Artifact Registry image."
  default     = ""
}

variable "scraper_image" {
  type        = string
  description = "Container image URI for the stealth scraper sidecar container. Defaults to the project Artifact Registry image."
  default     = ""
}

variable "lb_domain" {
  type        = string
  description = "Optional custom domain for the Managed SSL Certificate. Defaults to <lb_ip>.sslip.io."
  default     = ""
}
