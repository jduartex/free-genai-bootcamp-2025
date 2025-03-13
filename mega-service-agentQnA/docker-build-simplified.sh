#!/bin/bash
# Simplified script to build or pull the agent Docker image

# Define working directory
WORKDIR=/Users/jduarte/Documents/GenAIBootcamp/free-genai-bootcamp-2025/mega-service-agentQnA

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "=============================="
echo "AgentQnA Docker Image Builder"
echo "=============================="

# Check if Docker is running
if ! command_exists docker; then
    echo "ERROR: Docker is not installed or not in PATH."
    echo "Please install Docker Desktop for macOS from https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check if Docker daemon is running
docker info >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "ERROR: Docker daemon is not running."
    echo "Please start Docker Desktop and try again."
    exit 1
fi

echo ""
echo "Select an option:"
echo "1) Pull pre-built OPEA agent image (recommended)"
echo "2) Build OPEA agent image locally (requires git, cmake)"
echo "3) Build simplified AgentQnA image"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo "Pulling pre-built OPEA agent image..."
        docker pull opea/agent:latest
        if [ $? -eq 0 ]; then
            echo "✅ Successfully pulled opea/agent:latest image"
        else
            echo "❌ Failed to pull image. Check your internet connection."
        fi
        ;;
    2)
        echo "Building OPEA agent image locally..."
        cd $WORKDIR/GenAIComps
        
        # Check for dependencies
        if ! command_exists git; then
            echo "ERROR: git is required for building. Install with: brew install git"
            exit 1
        fi
        
        # Install missing dependencies first
        brew install git cmake 2>/dev/null || true
        
        # Build the image with better error handling
        docker build -t opea/agent:latest \
          --build-arg https_proxy=$https_proxy \
          --build-arg http_proxy=$http_proxy \
          -f comps/agent/src/Dockerfile .
        
        if [ $? -eq 0 ]; then
            echo "✅ Successfully built opea/agent:latest image"
        else
            echo "❌ Build failed. Try option 1 to use the pre-built image instead."
        fi
        ;;
    3)
        echo "Building simplified AgentQnA image..."
        cd $WORKDIR
        
        docker build -t agentqna:latest \
          --build-arg https_proxy=$https_proxy \
          --build-arg http_proxy=$http_proxy \
          -f Dockerfile .
        
        if [ $? -eq 0 ]; then
            echo "✅ Successfully built agentqna:latest image"
        else
            echo "❌ Build failed. Check the error messages above."
        fi
        ;;
    *)
        echo "Invalid option. Exiting."
        exit 1
        ;;
esac

echo ""
echo "==============================="
echo "Docker images available:"
echo "==============================="
docker images | grep -E 'opea/agent|agentqna'
