#!/bin/bash

echo "Starting simplified Docker build process..."

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

# Try to use the pre-built image first
echo "Attempting to pull pre-built OPEA agent image..."
if docker pull opea/agent:latest; then
    echo "✅ Successfully pulled pre-built OPEA agent image"
    
    # Start the Mock API container - check if it exists first
    if docker ps -a | grep -q "crag-mock-api"; then
        echo "Mock API container exists, checking status..."
        if ! docker ps | grep -q "crag-mock-api"; then
            echo "Starting existing Mock API container..."
            docker start crag-mock-api
        else
            echo "✅ Mock API container is already running"
        fi
    else
        echo "Creating and starting Mock API container..."
        docker pull docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0
        docker run -d -p=8080:8000 --name crag-mock-api docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0
    fi
    echo "✅ Mock API running on port 8080"
    
    # Successful exit
    echo "✅ Docker setup completed successfully"
    exit 0
else
    echo "⚠️ Failed to pull pre-built image, attempting local build..."
fi

# Local build as fallback
echo "Building local Docker image (simplified version)..."
echo "This might take some time..."

# Pass the --no-cache flag to ensure a clean build
docker build --no-cache -t opea/agent:local .

if [ $? -eq 0 ]; then
    echo "✅ Local Docker build successful"
    exit 0
else
    echo "❌ Local Docker build failed"
    echo ""
    echo "Please try one of these alternatives:"
    echo "1. Manually pull the pre-built image: docker pull opea/agent:latest"
    echo "2. Ensure your internet connection is stable"
    echo "3. Install build dependencies: brew install git cmake pkg-config"
    exit 1
fi
