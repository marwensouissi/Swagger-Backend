output "kubeconfig_raw" {
  value     = digitalocean_kubernetes_cluster.k8s_cluster.kube_config[0].raw_config
  sensitive = true
}

output "kubeconfig_path" {
  value       = var.enable_k6_operator ? abspath(local_file.kubeconfig_yaml[0].filename) : null
  description = "Path to the generated kubeconfig"
}

output "argocd_server_url" {
  value       = "http://${helm_release.argocd.name}.${helm_release.argocd.namespace}.svc.cluster.local"
  description = "Internal service URL for ArgoCD"
}

output "argocd_namespace" {
  value       = "argocd"
  description = "Namespace where ArgoCD is deployed"
}
