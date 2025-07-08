variable "do_token" {
  description = "DigitalOcean API Token"
  type        = string
  sensitive   = true
}

variable "cluster_name" {
  description = "Kubernetes cluster name"
  default     = "k8s-k6-cluster"
}

variable "region" {
  description = "DigitalOcean region"
  default     = "nyc3"
}

variable "k8s_version" {
  description = "Kubernetes version"
  default     = "1.33.1-do.0"
}

variable "node_size" {
  description = "Node size"
  default     = "s-2vcpu-4gb"
}

variable "node_count" {
  description = "Number of nodes"
  default     = 2
}

variable "enable_k6_operator" {
  description = "Whether to install k6-operator using Helm"
  type        = bool
  default     = true
}
