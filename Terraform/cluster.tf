resource "digitalocean_kubernetes_cluster" "k8s_cluster" {
  name    = var.cluster_name
  region  = var.region
  version = var.k8s_version

  node_pool {
    name       = "worker-pool"
    size       = var.node_size
    node_count = var.node_count
  }
}

resource "local_file" "kubeconfig_yaml" {
  count    = var.enable_k6_operator ? 1 : 0
  content  = digitalocean_kubernetes_cluster.k8s_cluster.kube_config[0].raw_config
  filename = "${path.module}/kubeconfig_do.yaml"
}
