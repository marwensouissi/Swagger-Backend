#!/bin/bash

set -e

echo "⏳ Waiting for Kubernetes to be ready..."
sleep 30

# Ensure kubectl is authenticated
doctl kubernetes cluster kubeconfig save k8s-k6-cluster

echo "✅ Installing Helm if not present..."
if ! command -v helm &> /dev/null; then
  curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
fi

echo "📦 Adding Grafana Helm repo..."
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

echo "🚀 Installing k6-operator..."
helm install k6-operator grafana/k6-operator

echo "✅ k6-operator installed successfully!"