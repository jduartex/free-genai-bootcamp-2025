#!/bin/bash
# Script to verify Docker images and ensure they're properly available

# Function to print section headers
print_section() {
    echo ""
    echo "=============================="
    echo "$1"
    echo "=============================="
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_section "Docker Image Verification"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ ERROR: Docker daemon is not running."
    echo "Please start Docker Desktop and try again."
    exit 1
fi

# Verify OPEA agent image exists using different commands
echo "Checking for OPEA agent image using multiple methods..."

# Method 1: docker images
if docker images opea/agent:latest --format "{{.Repository}}:{{.Tag}}" | grep -q "opea/agent:latest"; then
    echo "✅ Method 1 (docker images): Image found"
else
    echo "❌ Method 1 (docker images): Image NOT found"
fi

# Method 2: docker inspect
if docker inspect opea/agent:latest > /dev/null 2>&1; then
    echo "✅ Method 2 (docker inspect): Image found"
    
    # Get image details
    IMAGE_ID=$(docker inspect --format='{{.Id}}' opea/agent:latest)
    
    # Format the size in a macOS-compatible way
    if command_exists numfmt; then
        IMAGE_SIZE=$(docker inspect --format='{{.Size}}' opea/agent:latest | numfmt --to=iec-i --suffix=B)
    else
        IMAGE_SIZE="$(docker inspect --format='{{.Size}}' opea/agent:latest | awk '{print $1/1024/1024 " MB"}')"
    fi
    
    IMAGE_CREATED=$(docker inspect --format='{{.Created}}' opea/agent:latest)
    
    echo "   Image ID: ${IMAGE_ID:0:12}"
    echo "   Size: $IMAGE_SIZE"
    echo "   Created: $IMAGE_CREATED"
else
    echo "❌ Method 2 (docker inspect): Image NOT found"
fi

# Try to run a simple command with the image to verify it works
print_section "Testing Image Usability"
echo "Trying to run a simple command with the image..."

# First try with a simpler command to check basic functionality
echo "Testing basic container functionality..."
if docker run --rm opea/agent:latest echo "Container started successfully" > /dev/null 2>&1; then
    echo "✅ Basic container functionality test passed"
else
    echo "❌ Basic container functionality test failed"
    echo "This could indicate an issue with the image architecture or Docker configuration."
    echo "Is your Docker configured to run images for your architecture (arm64 for M1/M2 Macs)?"
fi

# Try running Python to verify the Python environment
echo "Testing Python in container..."
docker run --rm opea/agent:latest python -c "print('Image is working!')" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Successfully ran a Python command in the container"
else
    echo "❌ Failed to run Python in the container"
    echo "Troubleshooting steps:"
    echo "1. The image may not be compatible with your architecture (arm64 for M1/M2 Macs)"
    echo "2. Try pulling a platform-specific version: docker pull --platform linux/arm64 opea/agent:latest"
    echo "3. Check if Python is installed in the image: docker run --rm opea/agent:latest which python"
fi

print_section "Architecture Check"
echo "Your host architecture: $(uname -m)"
echo "Image architecture: $(docker inspect --format='{{.Architecture}}' opea/agent:latest)"
echo "If these don't match, you may need a platform-specific image or enable emulation in Docker."

print_section "Complete Docker Image Information"
docker inspect opea/agent:latest | grep -A 3 -E 'Architecture|Os|VariantID' 

print_section "Next Steps"
echo "Since the image is visible in Docker Desktop but may have compatibility issues:"
echo "1. Try running with platform specification: docker run --platform linux/amd64 opea/agent:latest echo 'test'"
echo "2. Enable Docker's emulation features if working with non-native architectures"
echo "3. Consider pulling an arm64 version of the image if you're on Apple Silicon"
echo "4. Run a minimal container to check compatibility: docker run --rm opea/agent:latest uname -a"
