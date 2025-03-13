#!/bin/bash

echo "Launching opea/agent container..."

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

# Check if the image exists
if ! docker images | grep -q "opea/agent"; then
    echo "❌ opea/agent image not found"
    echo "Please run ./docker-build-simplified.sh first"
    exit 1
fi

# Check if container already exists
CONTAINER_NAME="opea-agent"
if docker ps -a | grep -q "$CONTAINER_NAME"; then
    echo "An opea-agent container already exists"
    
    # Check if it's running
    if docker ps | grep -q "$CONTAINER_NAME"; then
        echo "✅ Container is already running"
        echo "To access the web interface, visit: http://localhost:8000"
        echo ""
        echo "Showing container logs:"
        docker logs --tail 10 "$CONTAINER_NAME"
        exit 0
    else
        echo "Container exists but is not running."
        echo "Checking previous logs for potential issues:"
        docker logs --tail 10 "$CONTAINER_NAME"
        echo ""
        echo "Starting container..."
        docker start "$CONTAINER_NAME"
        echo "✅ Container started"
        echo "To access the web interface, visit: http://localhost:8000"
        exit 0
    fi
fi

# Check if ports are already in use
if command -v lsof &> /dev/null && lsof -i:8000 &> /dev/null; then
    echo "⚠️ Warning: Port 8000 is already in use"
    echo "The agent container may not be able to bind to this port"
    echo "Checking what's using the port:"
    lsof -i:8000
fi

# Make sure we have an env file
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "Creating default .env from .env.example..."
        cp .env.example .env
    else
        echo "Creating minimal .env file..."
        echo "LOG_LEVEL=DEBUG" > .env
    fi
fi

# Launch the container with interactive logs
echo "Creating and starting new opea-agent container with default configuration..."
docker run -d \
    --name "$CONTAINER_NAME" \
    -p 8000:8000 \
    -v "$PWD/data:/app/data" \
    -v "$PWD/db:/app/db" \
    -v "$PWD/logs:/app/logs" \
    --env-file .env \
    -e PYTHONUNBUFFERED=1 \
    opea/agent:latest

if [ $? -eq 0 ]; then
    echo "✅ opea/agent container started successfully"
    echo "Showing startup logs (wait a moment for the server to start):"
    sleep 3
    docker logs "$CONTAINER_NAME"
    echo ""
    echo "To access the web interface, visit: http://localhost:8000"
    echo "If you can't connect, check logs with: docker logs $CONTAINER_NAME"
    
    # Connect it to the same network as the mock API
    if docker network inspect bridge | grep -q "crag-mock-api"; then
        echo "✅ Both containers are on the bridge network and can communicate"
    fi
else
    echo "❌ Failed to start opea/agent container"
    echo "Check the error message above for details"
fi
