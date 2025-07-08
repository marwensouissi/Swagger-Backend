provider "digitalocean" {
  token = var.do_token
}

provider "kubernetes" {
  config_path = "${path.module}/kubeconfig_do.yaml"
}

provider "helm" {
  kubernetes {
    config_path = "${path.module}/kubeconfig_do.yaml"
  }
}
