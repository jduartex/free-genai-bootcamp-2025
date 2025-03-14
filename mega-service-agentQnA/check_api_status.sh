#!/bin/bash

echo "=========================================================="
echo "MOCK API STATUS CHECKER"
echo "=========================================================="
echo "This script will monitor the Mock API until it's ready to accept connections"

# Ensure Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

# Check if containers are running
echo "Checking container status..."
if ! docker ps | grep -q "crag-mock-api"; then
    echo "❌ Mock API container is not running"
    exit 1
else
    echo "✅ Mock API container is running"
fi

if ! docker ps | grep -q "minimal-agent"; then
    echo "❌ Minimal agent container is not running"
    exit 1
else
    echo "✅ Minimal agent container is running"
fi

# Function to check if Mock API is ready
check_mock_api() {
    echo "Checking if Mock API is ready to accept connections..."
    
    # Check the logs for initialization complete markers
    if docker logs crag-mock-api | grep -q "Music KG initialized"; then
        echo "✅ Mock API initialization complete"
        return 0
    else
        echo "⏳ Mock API still initializing..."
        return 1
    fi
}

# Function to try connection from minimal-agent to Mock API
try_connection() {
    echo "Testing connection from minimal agent to Mock API..."
    
    # Test direct container name connection
    echo "Testing connection to crag-mock-api:8000..."
    if docker exec minimal-agent curl -s --max-time 5 http://crag-mock-api:8000/ > /dev/null; then
        echo "✅ Connection successful using container name"
        WORKING_URL="http://crag-mock-api:8000/generate"
        return 0
    fi
    
    # Test using host.docker.internal
    echo "Testing connection to host.docker.internal:8080..."
    if docker exec minimal-agent curl -s --max-time 5 http://host.docker.internal:8080/ > /dev/null; then
        echo "✅ Connection successful using host.docker.internal"
        WORKING_URL="http://host.docker.internal:8080/generate"
        return 0
    fi
    
    # Test using container IP
    MOCK_API_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' crag-mock-api)
    echo "Testing connection to container IP ${MOCK_API_IP}:8000..."
    if docker exec minimal-agent curl -s --max-time 5 http://${MOCK_API_IP}:8000/ > /dev/null; then
        echo "✅ Connection successful using container IP"
        WORKING_URL="http://${MOCK_API_IP}:8000/generate"
        return 0
    fi
    
    echo "❌ All connection methods failed"
    return 1
}

# Wait for Mock API to be ready
echo "Waiting for Mock API to finish initializing..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    echo "Attempt $attempt of $max_attempts..."
    
    if check_mock_api; then
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ Mock API failed to initialize after $max_attempts attempts"
        echo "Check logs for errors: docker logs crag-mock-api"
        exit 1
    fi
    
    echo "Waiting 10 seconds before next check..."
    sleep 10
    attempt=$((attempt+1))
done

# Now try to connect
echo "Mock API is initialized, testing connection..."
if try_connection; then
    echo "Found working connection URL: $WORKING_URL"
    
    # Update the minimal agent to use this URL
    echo "Updating minimal agent configuration..."
    docker exec -it minimal-agent bash -c "echo 'export MOCK_API_URL=${WORKING_URL}' > /app/.env"
    
    # Restart the minimal agent
    echo "Restarting minimal agent to apply configuration..."
    docker restart minimal-agent
    
    echo "Waiting for minimal agent to start..."
    sleep 5
    
    echo "✅ Setup complete! The minimal agent should now be able to communicate with the Mock API."
    echo "Try accessing the web interface at http://localhost:8000"
else
    echo "❌ Failed to establish connection between minimal agent and Mock API"
    echo ""
    echo "Try these manual debugging steps:"
    echo "1. Check network configuration:"
    echo "   docker network inspect agentqna-network"
    echo ""
    echo "2. Check if Mock API is responding:"
    echo "   curl http://localhost:8080/"
    echo ""
    echo "3. Connect to minimal agent container for troubleshooting:"
    echo "   docker exec -it minimal-agent bash"
    echo "   Inside the container: curl http://crag-mock-api:8000/"
    echo ""
    echo "4. Restart both containers:"
    echo "   docker restart crag-mock-api minimal-agent"
fi
