#!/bin/bash

CONTAINER_NAME="opea-agent"
echo "Troubleshooting opea/agent container connection issues..."

# Check if the container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ Container is not running!"
    
    # Check if it exists but is stopped
    if docker ps -a | grep -q "$CONTAINER_NAME"; then
        echo "Container exists but is stopped. Checking logs for failure reason:"
        docker logs "$CONTAINER_NAME" | tail -n 30
        
        echo ""
        echo "Attempting to start the container..."
        docker start "$CONTAINER_NAME"
        sleep 3
        
        # Check if it's running now
        if docker ps | grep -q "$CONTAINER_NAME"; then
            echo "✅ Container started successfully"
        else
            echo "❌ Failed to start container"
        fi
    else
        echo "Container doesn't exist. Run launch_agent_container.sh first."
        exit 1
    fi
else
    echo "✅ Container is running"
fi

# Check port binding
echo ""
echo "Checking port binding..."
if docker port "$CONTAINER_NAME" | grep -q "8000"; then
    echo "✅ Port 8000 is mapped correctly"
else
    echo "❌ Port mapping issue detected"
    echo "Current port mappings:"
    docker port "$CONTAINER_NAME" || echo "No port mappings found"
fi

# Check container logs
echo ""
echo "Checking container logs for errors..."
docker logs "$CONTAINER_NAME" | grep -i "error\|exception\|failed" | tail -n 10

# Check if backend process is running inside container
echo ""
echo "Checking if backend process is running inside container..."
docker exec "$CONTAINER_NAME" ps aux | grep -i "uvicorn\|python" || echo "No backend process found"

# Check architecture compatibility
echo ""
echo "Checking architecture compatibility..."
echo "Host architecture: $(uname -m)"
echo "Container architecture: $(docker exec "$CONTAINER_NAME" uname -m 2>/dev/null || echo "Unable to determine")"

# Check for AVX instructions
echo ""
echo "Checking for AVX instructions in container..."
docker exec "$CONTAINER_NAME" grep -q avx /proc/cpuinfo 2>/dev/null
if [ $? -eq 0 ]; then
    echo "AVX instructions available in container"
else
    echo "⚠️ AVX instructions NOT available in container"
    echo "This will cause issues with some Python packages like JAX"
    echo "Consider using the minimal agent container for ARM64 compatibility"
    echo "(Run ./launch_minimal_agent.sh)"
fi

# Recreate container with compatibility mode
echo ""
echo "Would you like to try the minimal agent container for ARM64 compatibility? (y/N): "
read -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Launching minimal agent container..."
    chmod +x ./launch_minimal_agent.sh
    ./launch_minimal_agent.sh
fi

# Final guidance
echo ""
echo "Next steps for troubleshooting:"
echo "1. Use the minimal agent container for ARM64 compatibility (./launch_minimal_agent.sh)"
echo "2. Try connecting directly to the mock API at http://localhost:8080"
echo "3. For full agent functionality, consider running on an x86_64 machine"
