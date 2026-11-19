terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.36"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = ">= 5.36"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = local.deploy_region
}

provider "google-beta" {
  project = var.project_id
  region  = local.deploy_region
}
