resource "helm_release" "k6_operator" {
  count            = var.enable_k6_operator ? 1 : 0
  name             = "k6-operator"
  repository       = "https://grafana.github.io/helm-charts"
  chart            = "k6-operator"
  namespace        = "default"
  create_namespace = true
  wait             = true
  timeout          = 300

  depends_on = [
    digitalocean_kubernetes_cluster.k8s_cluster,
    local_file.kubeconfig_yaml
  ]
}
