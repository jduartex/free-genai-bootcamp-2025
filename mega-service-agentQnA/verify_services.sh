#!/bin/bash

echo "Verifying services connectivity..."

# Test minimal agent connectivity
echo ""
echo "Testing connection to minimal agent (http://localhost:8000)..."
if command -v curl &> /dev/null; then
    # Use curl if available
    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000)
    if [ "$STATUS_CODE" = "200" ]; then
        echo "✅ Minimal agent is accessible on http://localhost:8000"
        echo "  Status code: $STATUS_CODE"
        echo "  You can open this URL in your browser to view the interface"
    else
        echo "❌ Minimal agent returned status code: $STATUS_CODE"
    fi
elif python -c "import urllib.request; response = urllib.request.urlopen('http://localhost:8000'); print(response.getcode())" &> /dev/null; then
    # Fallback to Python
    echo "✅ Minimal agent is accessible on http://localhost:8000"
else
    echo "❌ Could not connect to minimal agent"
    echo "  Check if the container is running: docker ps"
    echo "  View logs: docker logs minimal-agent"
fi

# Test mock API connectivity
echo ""
echo "Testing connection to mock API (http://localhost:8080)..."
if command -v curl &> /dev/null; then
    # Use curl if available
    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)
    if [ "$STATUS_CODE" = "200" ]; then
        echo "✅ Mock API is accessible on http://localhost:8080"
        echo "  Status code: $STATUS_CODE"
        
        # Get API details
        API_INFO=$(curl -s http://localhost:8080)
        echo "  API response: $API_INFO"
    else
        echo "❌ Mock API returned status code: $STATUS_CODE"
    fi
elif python -c "import urllib.request; response = urllib.request.urlopen('http://localhost:8080'); print(response.getcode())" &> /dev/null; then
    # Fallback to Python
    echo "✅ Mock API is accessible on http://localhost:8080"
else
    echo "❌ Could not connect to mock API"
    echo "  Check if the container is running: docker ps"
    echo "  View logs: docker logs crag-mock-api"
fi

# Check if containers can communicate with each other
echo ""
echo "Testing container network communication..."
if docker ps | grep -q "minimal-agent" && docker ps | grep -q "crag-mock-api"; then
    echo "✅ Both containers are running"
    
    # Test if minimal-agent can reach mock-api
    if docker exec minimal-agent curl -s --connect-timeout 5 http://host.docker.internal:8080 > /dev/null; then
        echo "✅ Minimal agent can connect to mock API"
    else
        echo "❌ Minimal agent cannot connect to mock API"
        echo "  This may be due to Docker network configuration"
    fi
else
    echo "❌ One or both containers are not running"
fi

echo ""
echo "Next steps:"
echo "1. Open http://localhost:8000 in your browser to access the minimal agent interface"
echo "2. You can test the mock API directly via http://localhost:8080"
echo "3. If you need the full agent features, you'll need to run on an x86_64 machine"
echo "   or use a native ARM64 build of the agent"
