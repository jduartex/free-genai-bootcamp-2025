#!/bin/bash

echo "=========================================================="
echo "QUICK CONNECTION TEST"
echo "=========================================================="

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo "❌ curl command not found"
    exit 1
fi

# Test API directly
echo "Testing direct API connection from host..."
curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"prompt":"Hello, is the API working?"}' \
    http://localhost:8080/generate | grep -q "response" && \
    echo "✅ Direct API connection successful" || \
    echo "❌ Direct API connection failed"

echo ""

# Test through minimal agent
echo "Testing connection through minimal agent..."
curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"message":"Hello, is the minimal agent working?"}' \
    http://localhost:8000/api/chat | grep -q "Failed to" && \
    echo "❌ API call failing in minimal agent" || \
    echo "✅ Minimal agent connection successful" 

echo ""
echo "If direct API connection works but minimal agent fails:"
echo "1. Run ./force_api_connection.sh to fix the container network"
echo "2. Wait longer for API initialization to complete"
