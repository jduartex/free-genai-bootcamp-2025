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

# Check if the Mock API container is running
echo "Checking if Mock API container is running..."
if ! docker ps | grep -q "crag-mock-api"; then
    echo "⚠️ Mock API container is not running!"
    echo "Starting Mock API container..."
    # Try to start it if it exists
    if docker ps -a | grep -q "crag-mock-api"; then
        docker start crag-mock-api
    else
        echo "Mock API container not found. It will need to be created."
        echo "Run setup.sh first to create the Mock API container."
    fi
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
        
        # Check if the service is actually responding
        echo "Checking if the backend API is responding..."
        if curl -s http://localhost:8000/health &>/dev/null || curl -s http://localhost:8000/api/health &>/dev/null; then
            echo "✅ Backend API is responding"
        else
            echo "❌ Backend API is not responding even though container is running!"
            echo "This may be why you're seeing proxy errors from the frontend."
            echo "Try restarting the container: docker restart $CONTAINER_NAME"
            echo "Or check logs for errors: docker logs $CONTAINER_NAME"
        fi
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
        
        # Give it a moment to start up
        echo "Waiting for service to start..."
        sleep 5
        
        # Check if the service is actually responding
        if curl -s http://localhost:8000/health &>/dev/null || curl -s http://localhost:8000/api/health &>/dev/null; then
            echo "✅ Backend API is responding"
        else
            echo "⚠️ Backend API is not responding yet. It might still be starting up."
            echo "Check container logs: docker logs $CONTAINER_NAME"
        fi
        exit 0
    fi
fi

# Check if ports are already in use
if command -v lsof &> /dev/null && lsof -i:8000 &> /dev/null; then
    echo "⚠️ Warning: Port 8000 is already in use"
    echo "The agent container may not be able to bind to this port"
    echo "Checking what's using the port:"
    lsof -i:8000
    
    echo ""
    echo "You need to stop the process using port 8000 before continuing."
    echo "Would you like to kill all processes using port 8000? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Attempting to free port 8000..."
        if command -v lsof &> /dev/null; then
            # Get PIDs and kill them
            for pid in $(lsof -ti:8000); do
                echo "Killing process $pid"
                kill -9 $pid
            done
        fi
    else
        echo "Exiting. Please free port 8000 manually and try again."
        exit 1
    fi
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

# Ensure required directories exist
echo "Ensuring required directories exist..."
mkdir -p data db logs
chmod -R 755 data db logs

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
    --add-host=host.docker.internal:host-gateway \
    opea/agent:latest

if [ $? -eq 0 ]; then
    echo "✅ opea/agent container started successfully"
    echo "Showing startup logs (wait a moment for the server to start):"
    sleep 5
    docker logs "$CONTAINER_NAME"
    echo ""
    
    # Check if service is responding
    echo "Checking if the backend API is responding..."
    max_attempts=6
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        echo "Attempt $attempt of $max_attempts..."
        if curl -s http://localhost:8000/health &>/dev/null || curl -s http://localhost:8000/api/health &>/dev/null; then
            echo "✅ Backend API is responding!"
            echo "To access the web interface, visit: http://localhost:8000"
            break
        else
            if [ $attempt -eq $max_attempts ]; then
                echo "❌ Backend API is not responding after $max_attempts attempts!"
                echo "This is why you're seeing proxy errors from the frontend."
                echo "Check container logs for errors: docker logs $CONTAINER_NAME"
                echo ""
                echo "TROUBLESHOOTING FOR PROXY ERRORS:"
                echo "1. Check if the backend process is running inside the container:"
                echo "   docker exec $CONTAINER_NAME ps aux | grep python"
                echo ""
                echo "2. Try restarting the container:"
                echo "   docker restart $CONTAINER_NAME"
                echo ""
                echo "3. Check the application logs inside the container:"
                echo "   docker exec $CONTAINER_NAME cat /app/logs/app.log"
                echo ""
                echo "4. If your frontend is running on port 3000 and can't connect to port 8000,"
                echo "   make sure nothing else is using port 8000 on your host machine."
            else
                echo "Backend not responding yet, waiting..."
                sleep 5
            fi
        fi
        attempt=$((attempt+1))
    done
    
    # Connect it to the same network as the mock API
    if docker network inspect bridge | grep -q "crag-mock-api"; then
        echo "✅ Both containers are on the bridge network and can communicate"
    else
        echo "⚠️ Warning: Mock API container not found on bridge network"
        echo "Communication between containers may not work correctly"
    fi
else
    echo "❌ Failed to start opea/agent container"
    echo "Check the error message above for details"
    echo "Try running: docker system prune -f"
    echo "Then run this script again"
fi
