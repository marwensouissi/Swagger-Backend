resource "helm_release" "argocd" {
  name             = "argocd"
  namespace        = "argocd"
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argo-cd"
  version          = "5.51.6"
  create_namespace = true
  wait             = true
  timeout          = 300

  values = [
    <<EOF
server:
  service:
    type: LoadBalancer
EOF
  ]

  depends_on = [
    digitalocean_kubernetes_cluster.k8s_cluster,
    local_file.kubeconfig_yaml
  ]
}
