#!/bin/bash

echo "=========================================================="
echo "CRAG DOMAIN ADAPTER INSTALLER"
echo "=========================================================="
echo "This script will install the specialized CRAG Domain Adapter"

# Check if containers are running
if ! docker ps | grep -q "crag-mock-api"; then
    echo "❌ Mock API container is not running"
    exit 1
fi

if ! docker ps | grep -q "minimal-agent"; then
    echo "❌ Minimal agent container is not running"
    exit 1
fi

# Copy the domain adapter to the container
echo "Installing CRAG Domain Adapter..."
docker cp crag_domain_adapter.py minimal-agent:/app/crag_domain_adapter.py

# Copy and run the update script
echo "Updating minimal agent to use the domain adapter..."
docker cp update_agent.py minimal-agent:/app/update_agent.py
docker exec minimal-agent python /app/update_agent.py

# Copy the test script
echo "Installing test script..."
docker cp test_domain_adapter.py minimal-agent:/app/test_domain_adapter.py
docker exec minimal-agent chmod +x /app/test_domain_adapter.py

# Restart the minimal agent
echo "Restarting minimal agent to apply changes..."
docker restart minimal-agent

# Wait for container to restart
echo "Waiting for container to restart..."
sleep 5

# Run a simple test to verify it works
echo "Testing the new domain adapter..."
curl -s -X POST \
     -H "Content-Type: application/json" \
     -d '{"message":"What movie did Christopher Nolan direct in 2010?"}' \
     http://localhost:8000/api/chat

echo ""
echo "=========================================================="
echo "INSTALLATION COMPLETE"
echo "=========================================================="
echo ""
echo "The minimal agent is now using the CRAG Domain Adapter which will:"
echo "1. Determine the appropriate domain for each query (movie, finance, music, sports, etc.)"
echo "2. Route queries to the correct specialized endpoint"
echo "3. Format responses from domain-specific data"
echo "4. Use successful endpoints for future queries in the same domain"
echo ""
echo "You can access the web interface at: http://localhost:8000"
echo "For diagnostics, run: docker exec -it minimal-agent /app/test_domain_adapter.py"
