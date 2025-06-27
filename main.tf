terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.49.1"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.36.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.15.0"
    }
  }
}

##########################
# VARIABLES
##########################

variable "do_token" {
  description = "DigitalOcean API Token"
  type        = string
  sensitive   = true
}

variable "cluster_name" {
  default     = "k8s-k6-cluster"
  description = "Kubernetes cluster name"
}

variable "region" {
  default     = "nyc3"
  description = "DigitalOcean region"
}

variable "k8s_version" {
  default     = "1.32.2-do.0"
  description = "Kubernetes version"
}

variable "node_size" {
  default     = "s-2vcpu-4gb"
  description = "Node size"
}

variable "node_count" {
  default     = 2
  description = "Number of nodes"
}

variable "enable_k6_operator" {
  description = "Whether to install k6-operator using Helm"
  type        = bool
  default     = true
}

##########################
# PROVIDERS
##########################

provider "digitalocean" {
  token = var.do_token
}

provider "kubernetes" {
  host                   = digitalocean_kubernetes_cluster.k8s_cluster.endpoint
  cluster_ca_certificate = base64decode(digitalocean_kubernetes_cluster.k8s_cluster.kube_config[0].cluster_ca_certificate)
  token                  = digitalocean_kubernetes_cluster.k8s_cluster.kube_config[0].token
}

provider "helm" {
  kubernetes {
    host                   = digitalocean_kubernetes_cluster.k8s_cluster.endpoint
    cluster_ca_certificate = base64decode(digitalocean_kubernetes_cluster.k8s_cluster.kube_config[0].cluster_ca_certificate)
    token                  = digitalocean_kubernetes_cluster.k8s_cluster.kube_config[0].token
  }
}

##########################
# RESOURCES
##########################

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

resource "helm_release" "k6_operator" {
  count            = var.enable_k6_operator ? 1 : 0
  name             = "k6-operator"
  repository       = "https://grafana.github.io/helm-charts"
  chart            = "k6-operator"
  namespace        = "default"
  create_namespace = true
  wait             = true
  timeout          = 300
}

resource "local_file" "kubeconfig_yaml" {
  count    = var.enable_k6_operator ? 1 : 0
  content  = digitalocean_kubernetes_cluster.k8s_cluster.kube_config[0].raw_config
  filename = "${path.module}/kubeconfig_do.yaml"
}

##########################
# OUTPUTS
##########################

output "kubeconfig_raw" {
  value     = digitalocean_kubernetes_cluster.k8s_cluster.kube_config[0].raw_config
  sensitive = true
}

output "kubeconfig_path" {
  value       = var.enable_k6_operator ? abspath(local_file.kubeconfig_yaml[0].filename) : null
  description = "Path to the generated kubeconfig"
}
