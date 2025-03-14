#!/bin/bash

echo "=========================================================="
echo "MOCK API COMPLETE REPAIR"
echo "=========================================================="
echo "This script will recreate the Mock API container and ensure it works"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

# Stop and remove existing Mock API container to start fresh
echo "Removing any existing Mock API container..."
docker stop crag-mock-api 2>/dev/null || true
docker rm crag-mock-api 2>/dev/null || true

# Create a dedicated network if it doesn't exist
echo "Creating a dedicated Docker network..."
NETWORK_NAME="agentqna-network"
docker network create $NETWORK_NAME 2>/dev/null || true

# Pull the latest image to ensure we have the correct version
echo "Pulling the latest Mock API image..."
docker pull docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0

# Start a new container with proper networking and port mapping
echo "Starting a new Mock API container..."
docker run -d \
    --name crag-mock-api \
    --network $NETWORK_NAME \
    -p 8080:8000 \
    docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0

if [ $? -ne 0 ]; then
    echo "❌ Failed to start Mock API container"
    exit 1
fi

echo "✅ Mock API container started"

# Check if minimal agent is running
echo "Checking minimal agent container..."
if ! docker ps | grep -q "minimal-agent"; then
    echo "⚠️ Minimal agent not running. Starting it with fix_minimal_agent.sh..."
    ./fix_minimal_agent.sh
else
    echo "✅ Minimal agent is running"
    
    # Connect it to our network if not already connected
    if ! docker network inspect $NETWORK_NAME | grep -q "minimal-agent"; then
        echo "Connecting minimal-agent to the $NETWORK_NAME network..."
        docker network connect $NETWORK_NAME minimal-agent
    fi
fi

# Wait for the Mock API to initialize
echo ""
echo "Waiting for Mock API to initialize (this may take several minutes)..."
echo "Showing initialization progress. Please be patient..."
echo ""

# Display initialization progress
max_wait=300  # Maximum wait time in seconds (5 minutes)
start_time=$(date +%s)

while true; do
    # Check if initialization is complete by looking for "Application startup complete"
    if docker logs crag-mock-api 2>&1 | grep -q "Application startup complete"; then
        echo ""
        echo "✅ Mock API initialization complete!"
        break
    fi
    
    # Show recent log lines to indicate progress
    docker logs --tail 3 crag-mock-api 2>/dev/null | grep -v "^$" | head -1
    
    # Check if we've exceeded the maximum wait time
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))
    
    if [ $elapsed -gt $max_wait ]; then
        echo ""
        echo "⚠️ Maximum wait time exceeded. The Mock API is still initializing."
        echo "You can continue with the setup, but the API might not respond immediately."
        break
    fi
    
    # Wait before checking again
    sleep 10
done

# Create a special test file to verify the API can respond
echo "Creating a test client for the Mock API..."
TEST_SCRIPT=$(mktemp)
cat > $TEST_SCRIPT << 'EOL'
import requests
import json
import sys
import time

def test_api(url, retries=5):
    print(f"Testing API at {url}")
    
    for i in range(retries):
        try:
            response = requests.post(
                url,
                json={"prompt": "Hello, is this working?"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"SUCCESS! API returned: {data.get('response', '')[:100]}...")
                return True
            else:
                print(f"Attempt {i+1}/{retries}: API returned status {response.status_code}")
                
        except Exception as e:
            print(f"Attempt {i+1}/{retries}: Error: {str(e)}")
        
        if i < retries - 1:
            print(f"Waiting before retry...")
            time.sleep(5)
    
    return False

# Test direct access from Docker container
container_urls = [
    "http://crag-mock-api:8000/generate",
    "http://localhost:8080/generate"
]

success = False
for url in container_urls:
    if test_api(url):
        print(f"\n✓ Found working URL: {url}")
        success = True
        # Save the working URL for the container to use
        with open("/tmp/working_api_url.txt", "w") as f:
            f.write(url)
        break

if not success:
    print("\n❌ Could not connect to the Mock API")
    sys.exit(1)
EOL

# Copy the test script to the minimal-agent container and run it
echo "Testing Mock API from within the minimal-agent container..."
docker cp $TEST_SCRIPT minimal-agent:/tmp/test_api.py
docker exec minimal-agent python /tmp/test_api.py

# Check the test result
if [ $? -ne 0 ]; then
    echo "❌ Connection test failed!"
    echo "The Mock API is not yet ready to accept requests."
    echo "This could be because initialization is still in progress."
    echo ""
    echo "Try running this script again in a few minutes."
else
    echo "✅ Connection test successful!"
    
    # Get the working URL from the container
    WORKING_URL=$(docker exec minimal-agent cat /tmp/working_api_url.txt)
    
    # Update the minimal agent to use the working URL
    UPDATE_SCRIPT=$(mktemp)
    cat > $UPDATE_SCRIPT << EOL
import os

# File to modify
filename = '/app/main.py'

with open(filename, 'r') as file:
    content = file.read()

# Replace the Mock API URL with the working one
working_url = "${WORKING_URL}"

if "host.docker.internal:8080" in content:
    updated_content = content.replace(
        "http://host.docker.internal:8080/generate",
        working_url
    )
    
    with open(filename, 'w') as file:
        file.write(updated_content)
    
    print(f"Updated main.py to use {working_url}")
EOL

    # Copy and run the update script in the container
    echo "Updating minimal agent to use the working URL: $WORKING_URL"
    docker cp $UPDATE_SCRIPT minimal-agent:/tmp/update_url.py
    docker exec minimal-agent python /tmp/update_url.py
    
    # Restart the minimal agent
    echo "Restarting minimal agent to apply changes..."
    docker restart minimal-agent
    
    # Clean up temp files
    rm $TEST_SCRIPT $UPDATE_SCRIPT
    
    echo ""
    echo "Waiting for minimal agent to restart..."
    sleep 5
    
    echo "Testing the updated connection..."
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"message":"Hello, is the connection working now?"}' \
        http://localhost:8000/api/chat | json_pp || echo "Response is not valid JSON"
    
    echo ""
    echo "✅ Setup complete!"
    echo "The minimal agent should now be able to communicate with the Mock API."
    echo "If you still see connection errors, wait a few more minutes for the"
    echo "Mock API to fully initialize all its components."
    echo ""
    echo "To access the web interface: http://localhost:8000"
fi

echo ""
echo "TROUBLESHOOTING TIP: The Mock API takes a LONG time to initialize all its components."
echo "If you continue to experience issues, try again in 5-10 minutes as initialization completes."
