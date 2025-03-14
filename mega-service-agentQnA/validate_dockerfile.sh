#!/bin/bash

echo "Validating Docker configuration..."

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed or not in PATH"
    echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check if requirements.txt exists in the project root
if [ ! -f "./requirements.txt" ]; then
    echo "⚠️ Warning: requirements.txt not found in project root"
    echo "This file is needed for custom builds, but not required when using pre-built images"
else
    echo "✅ requirements.txt found"
fi

# Check if the pre-built image is available
if docker images | grep -q "opea/agent"; then
    echo "✅ OPEA agent Docker image is available"
else
    echo "⚠️ OPEA agent Docker image not found locally"
    echo "Attempting to check if it's available for pull..."
    
    # Try pulling the image without actually downloading it
    if docker manifest inspect opea/agent:latest &>/dev/null; then
        echo "✅ OPEA agent image is available for pull"
        echo "Run: docker pull opea/agent:latest"
    else
        echo "❌ OPEA agent image not found in registry"
        echo "You'll need to build it locally or use an alternative"
    fi
fi

echo ""
echo "To build or use Docker images:"
echo "1. Run ./docker-build-simplified.sh to attempt automatic setup"
echo "2. Or pull pre-built image: docker pull opea/agent:latest"
echo "3. Start Mock API container: docker run -d -p=8080:8000 --name crag-mock-api docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0"
exit 0
