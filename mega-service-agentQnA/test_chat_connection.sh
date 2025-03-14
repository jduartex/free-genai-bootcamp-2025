#!/bin/bash

echo "=========================================================="
echo "CHAT API CONNECTION TEST"
echo "=========================================================="
echo "This script will test if the minimal agent can talk to the Mock API"

# Send a test message
echo "Sending test message to chat API..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"What can you tell me about this project?"}' \
  http://localhost:8000/api/chat | jq || echo "Failed to parse response as JSON, showing raw response:" && \
  curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"What can you tell me about this project?"}' \
  http://localhost:8000/api/chat

echo ""
echo "If you see a proper response above with content from the Mock API,"
echo "then the connection is working correctly."
echo ""
echo "To access the web interface: http://localhost:8000"
