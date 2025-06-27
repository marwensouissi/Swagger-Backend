terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.49.1"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

# ===============================
# VARIABLES
# ===============================

variable "do_token" {
  description = "DigitalOcean API Token"
  type        = string
  sensitive   = true
}

variable "ssh_key_id" {
  description = "DigitalOcean SSH Key ID"
  type        = string
}


variable "droplet_name" {
  description = "Name of the Droplet"
  type        = string
  default     = "k6-vm"
}

variable "region" {
  description = "Region where Droplet will be created"
  type        = string
  default     = "nyc3"
}

variable "size" {
  description = "Droplet size"
  type        = string
  default     = "s-2vcpu-4gb"
}

variable "image" {
  description = "Droplet base image"
  type        = string
  default     = "ubuntu-22-04-x64"
}
  variable "ssh_private_key" {
  description = "Content of the private SSH key"
  type        = string
  sensitive   = true
}


# ===============================
# RESOURCE: DROPLET
# ===============================

resource "digitalocean_droplet" "k6_vm" {
  name     = var.droplet_name
  region   = var.region
  size     = var.size
  image    = var.image
  ssh_keys = [var.ssh_key_id]

  connection {
    type        = "ssh"
    user        = "root"
    host        = self.ipv4_address
    private_key = var.ssh_private_key
    timeout     = "3m"
  }




  provisioner "file" {
    source      = "script.sh"
    destination = "/tmp/script.sh"
  }

  provisioner "remote-exec" {
    inline = [
      "sleep 120",
      "while sudo fuser /var/lib/dpkg/lock >/dev/null 2>&1 || sudo fuser /var/lib/apt/lists/lock >/dev/null 2>&1; do echo 'Waiting for apt...'; sleep 5; done",
      "chmod +x /tmp/script.sh",
      "/tmp/script.sh"
    ]
  }
}

# ===============================
# OUTPUT
# ===============================

output "droplet_ip" {
  description = "Public IP of the created droplet"
  value       = digitalocean_droplet.k6_vm.ipv4_address
}
