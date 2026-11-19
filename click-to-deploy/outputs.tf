output "app_url" {
  description = "HTTPS URL for the GenFashion Atelier application behind External ALB and IAP."
  value       = "https://${local.resolved_domain}"
}

output "lb_ip" {
  description = "Global static IP address for the External HTTPS Application Load Balancer."
  value       = google_compute_global_address.web.address
}

output "cloud_run_service_name" {
  description = "Name of the deployed multi-container Cloud Run service."
  value       = google_cloud_run_v2_service.app.name
}

output "runtime_service_account" {
  description = "Least-privilege runtime service account email used by Cloud Run."
  value       = google_service_account.runtime.email
}

output "artifact_registry_repository" {
  description = "Artifact Registry repository path for container images."
  value       = "${local.deploy_region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.images.repository_id}"
}
