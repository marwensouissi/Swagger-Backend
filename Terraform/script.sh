#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive
sudo sed -i 's/^#\$nrconf{restart} =.*/\$nrconf{restart} = '\''a'\'';/g' /etc/needrestart/needrestart.conf || true


#!/bin/bash

echo "🔧 Updating system packages..."
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && \
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y


echo "🐳 Installing Docker..."
sudo apt-get install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker

echo "⚙️ Installing curl, wget, unzip, and other essentials..."
sudo apt-get install -y curl wget unzip bash ca-certificates gnupg lsb-release jq

echo "📦 Installing kubectl..."
curl -LO "https://dl.k8s.io/release/$(curl -Ls https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv ./kubectl /usr/local/bin/kubectl

echo "🚀 Installing Minikube..."
curl -LO https://github.com/kubernetes/minikube/releases/latest/download/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
rm minikube-linux-amd64

echo "🎮 Starting Minikube with Docker driver..."
sudo minikube start --driver=docker --force

echo "📦 Installing Helm..."
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

echo "📡 Adding Helm repos..."
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

echo "📥 Installing Prometheus..."
helm install prometheus prometheus-community/prometheus \
  --set server.service.type=NodePort \
  --set server.persistentVolume.enabled=false \
  --set alertmanager.enabled=false \
  --set pushgateway.enabled=false

echo "📊 Installing Grafana..."
helm install grafana grafana/grafana \
  --set adminPassword='admin' \
  --set service.type=NodePort \
  --set persistence.enabled=false

echo "📥 Installing k6-operator..."
helm install k6-operator grafana/k6-operator

echo "📌 Waiting for Grafana pod to be ready..."
kubectl wait --for=condition=Ready pod -l app.kubernetes.io/name=grafana --timeout=120s

echo "📊 Exposing NodePorts for Prometheus & Grafana..."
GRAFANA_PORT=$(kubectl get svc grafana -o json | jq -r '.spec.ports[0].nodePort')
PROMETHEUS_PORT=$(kubectl get svc prometheus-server -o json | jq -r '.spec.ports[0].nodePort')
MINIKUBE_IP=$(minikube ip)

echo "🔐 Default Grafana credentials: admin / admin"

echo "✅ Setup complete!"
echo "🌐 Access Prometheus: http://$MINIKUBE_IP:$PROMETHEUS_PORT"
echo "📈 Access Grafana:    http://$MINIKUBE_IP:$GRAFANA_PORT"

echo "✅ Setup complete!"
echo "Minikube is running, Helm is installed, and k6-operator is deployed."
r