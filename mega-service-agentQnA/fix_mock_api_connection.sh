#!/bin/bash

echo "=========================================================="
echo "MOCK API CONNECTION TROUBLESHOOTER"
echo "=========================================================="
echo "This script will diagnose and fix connections to the Mock API"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

# Check for the Mock API container
echo "Checking for Mock API container..."
if docker ps | grep -q "crag-mock-api"; then
    echo "✅ Mock API container is running"
    
    # Get container information
    echo "Mock API container details:"
    docker ps --format "{{.Names}} | {{.Ports}} | {{.Status}}" | grep "crag-mock-api"
    
    # Get port mappings
    PORT_MAPPING=$(docker port crag-mock-api)
    echo "Port mappings: $PORT_MAPPING"
    
    # Determine the port
    if echo "$PORT_MAPPING" | grep -q "8080"; then
        HOST_PORT=8080
    else
        # Try to parse the port from the mapping
        HOST_PORT=$(echo "$PORT_MAPPING" | grep -o '[0-9]*->8000/tcp' | cut -d'-' -f1)
        if [ -z "$HOST_PORT" ]; then
            echo "❌ Could not determine host port for Mock API"
            HOST_PORT=8080  # Default guess
        fi
    fi
    
    echo "Mock API appears to be running on port $HOST_PORT"
else
    echo "❌ Mock API container is not running!"
    
    # Check if it exists but is stopped
    if docker ps -a | grep -q "crag-mock-api"; then
        echo "Found stopped Mock API container. Starting it..."
        docker start crag-mock-api
        
        # Wait for it to start
        echo "Waiting for container to start..."
        sleep 3
        
        if docker ps | grep -q "crag-mock-api"; then
            echo "✅ Mock API container is now running"
            HOST_PORT=8080  # Assume default port
        else
            echo "❌ Failed to start Mock API container"
            exit 1
        fi
    else
        echo "❌ Mock API container does not exist"
        echo "Creating Mock API container..."
        
        # Pull and run the Mock API container
        docker pull docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0
        docker run -d -p=8080:8000 --name crag-mock-api docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0
        
        if [ $? -eq 0 ]; then
            echo "✅ Mock API container created and started"
            HOST_PORT=8080
        else
            echo "❌ Failed to create Mock API container"
            exit 1
        fi
    fi
fi

# Check if minimal agent container is running
echo "Checking minimal agent container..."
if ! docker ps | grep -q "minimal-agent"; then
    echo "❌ Minimal agent container is not running"
    echo "Please start it with ./fix_minimal_agent.sh first"
    exit 1
fi

# Update the minimal agent to use the correct port
echo "Updating minimal agent to connect to Mock API on port $HOST_PORT..."

# Create a temporary script to update the container
TMP_SCRIPT=$(mktemp)
cat > $TMP_SCRIPT << EOL
import os

# File to modify
filename = '/app/main.py'

with open(filename, 'r') as file:
    content = file.read()

# Replace the Mock API URL with the correct port
updated_content = content.replace(
    'http://host.docker.internal:8080/generate',
    'http://host.docker.internal:${HOST_PORT}/generate'
)

with open(filename, 'w') as file:
    file.write(updated_content)

print("Updated main.py to use port ${HOST_PORT} for Mock API")
EOL

# Copy the script to the container and run it
docker cp $TMP_SCRIPT minimal-agent:/app/update_port.py
docker exec minimal-agent python /app/update_port.py

# Restart the minimal agent
echo "Restarting minimal agent to apply changes..."
docker restart minimal-agent

# Clean up temporary file
rm $TMP_SCRIPT

# Test connectivity
echo "Waiting for agent to restart..."
sleep 3

echo "Testing connectivity to Mock API..."
docker exec minimal-agent curl -s -m 5 "http://host.docker.internal:$HOST_PORT/" || echo "Failed to connect"

echo "Testing API endpoint..."
curl -s -X POST -H "Content-Type: application/json" -d '{"message":"test"}' http://localhost:8000/api/chat | grep -q "Fixed Minimal Agent"
if [ $? -eq 0 ]; then
    echo "⚠️ Agent is using fallback responses, still not connected to Mock API"
    
    echo "Trying alternate network configuration..."
    
    # Get the IP address of the Mock API container
    MOCK_API_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' crag-mock-api)
    echo "Mock API container IP: $MOCK_API_IP"
    
    # Update the minimal agent to use the direct container IP
    cat > $TMP_SCRIPT << EOL
import os

# File to modify
filename = '/app/main.py'

with open(filename, 'r') as file:
    content = file.read()

# Replace the Mock API URL with the direct container IP
updated_content = content.replace(
    'http://host.docker.internal:${HOST_PORT}/generate',
    'http://${MOCK_API_IP}:8000/generate'
)

with open(filename, 'w') as file:
    file.write(updated_content)

print("Updated main.py to use direct container IP ${MOCK_API_IP}:8000 for Mock API")
EOL

    # Copy the script to the container and run it
    docker cp $TMP_SCRIPT minimal-agent:/app/update_ip.py
    docker exec minimal-agent python /app/update_ip.py
    
    # Restart the minimal agent
    echo "Restarting minimal agent with direct container IP..."
    docker restart minimal-agent
    
    # Clean up temporary file
    rm $TMP_SCRIPT
    
    echo "Waiting for agent to restart..."
    sleep 3
    
    echo "The agent should now try connecting directly to the Mock API container IP."
else
    echo "✅ Agent appears to be correctly connecting to the Mock API"
fi

# Final instructions
echo ""
echo "============================================================"
echo "MOCK API CONNECTION SETUP COMPLETE"
echo "============================================================"
echo ""
echo "To check if everything is working:"
echo "1. Open http://localhost:8000 in your browser"
echo "2. Click 'Test All Endpoints' to verify connections"
echo "3. Try sending a chat message to see if you get a response from the Mock API"
echo ""
echo "If you still have issues, try these commands:"
echo "- View minimal-agent logs: docker logs minimal-agent"
echo "- View Mock API logs: docker logs crag-mock-api"
echo "- Restart both containers: docker restart minimal-agent crag-mock-api"
