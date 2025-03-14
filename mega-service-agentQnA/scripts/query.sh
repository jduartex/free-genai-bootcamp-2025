#!/bin/bash

# This script tests the query API endpoint with curl

# Get the query content from command-line arguments or use a default
if [ $# -gt 0 ]; then
    # Combine all arguments into a single query
    QUERY="$*"
else
    # Default query
    QUERY="What is AgentQnA?"
fi

# Optional parameter for including sources (default: true)
INCLUDE_SOURCES=true

echo "Sending query to API: \"$QUERY\""

# Construct the JSON payload
JSON_PAYLOAD="{\"query\":\"$QUERY\",\"include_sources\":$INCLUDE_SOURCES}"

# Send request using curl and format the output with jq if available
if command -v jq &> /dev/null; then
    # jq is available, use it to format the JSON response
    curl -s -X POST http://localhost:8080/api/query \
      -H "Content-Type: application/json" \
      -d "$JSON_PAYLOAD" | jq
else
    # jq is not available, print the raw response
    curl -X POST http://localhost:8080/api/query \
      -H "Content-Type: application/json" \
      -d "$JSON_PAYLOAD"
fi
