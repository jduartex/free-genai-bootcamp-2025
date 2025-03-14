#!/bin/bash

echo "=========================================================="
echo "MOCK API STARTER"
echo "=========================================================="
echo "This script will start the Mock API container"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

# Create a dedicated network if it doesn't exist
NETWORK_NAME="agentqna-network"
echo "Ensuring network exists..."
docker network create $NETWORK_NAME 2>/dev/null || true

# Check if the Mock API container already exists
if docker ps -a | grep -q "crag-mock-api"; then
    echo "Mock API container exists. Starting it..."
    docker start crag-mock-api
    
    # Connect to the network if not already
    if ! docker network inspect $NETWORK_NAME | grep -q "crag-mock-api"; then
        docker network connect $NETWORK_NAME crag-mock-api
    fi
    
    # Wait a moment and check if it started successfully
    sleep 3
    if docker ps | grep -q "crag-mock-api"; then
        echo "✅ Mock API container started successfully"
    else
        echo "❌ Failed to start existing Mock API container"
        echo "Removing old container and creating a new one..."
        docker rm crag-mock-api
        NEEDS_NEW_CONTAINER=true
    fi
else
    echo "Mock API container does not exist."
    NEEDS_NEW_CONTAINER=true
fi

# If container doesn't exist or couldn't be started, create a new one
if [ "$NEEDS_NEW_CONTAINER" = true ]; then
    echo "Creating and starting a new Mock API container..."
    
    # Pull the image if needed
    echo "Pulling Mock API image..."
    docker pull docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0
    
    # Run the container
    echo "Starting container..."
    docker run -d \
        --name crag-mock-api \
        --network $NETWORK_NAME \
        -p 8080:8000 \
        --restart=on-failure:3 \
        docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0
    
    if [ $? -eq 0 ]; then
        echo "✅ Mock API container created and started successfully"
    else
        echo "❌ Failed to create Mock API container"
        echo "Try running: docker pull docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0"
        exit 1
    fi
fi

# Now connect minimal agent to the same network
if docker ps | grep -q "minimal-agent"; then
    echo "Connecting minimal-agent to the same network..."
    if ! docker network inspect $NETWORK_NAME | grep -q "minimal-agent"; then
        docker network connect $NETWORK_NAME minimal-agent
    fi
    
    # Make sure minimal-agent can access the Mock API
    echo "Testing connection from minimal-agent to crag-mock-api..."
    docker exec minimal-agent ping -c 1 crag-mock-api || echo "Note: Ping may not work, but HTTP connection might still work."
fi

echo ""
echo "=========================================================="
echo "MOCK API CONTAINER STARTED"
echo "=========================================================="
echo ""
echo "The Mock API needs to initialize (this might take several minutes)"
echo "You can monitor initialization with: docker logs -f crag-mock-api"
echo ""
echo "When initialization is complete, run one of these scripts to configure the connection:"
echo "- ./configure_crag_api.sh (recommended)"
echo "- ./fix_mock_api_connection.sh"
echo ""
echo "To access the web interface: http://localhost:8000"
