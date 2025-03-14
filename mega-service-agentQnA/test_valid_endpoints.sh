#!/bin/bash

echo "=========================================================="
echo "MOCK API VALID ENDPOINTS FINDER"
echo "=========================================================="
echo "This script will find working endpoints on the Mock API"

# Check if the Mock API container is running
if ! docker ps | grep -q "crag-mock-api"; then
    echo "❌ Mock API container is not running"
    exit 1
fi

echo "Checking API root endpoint..."
docker exec minimal-agent curl -s http://crag-mock-api:8000/

echo -e "\nTesting common endpoints for language model APIs..."

# List of common API endpoints to try
ENDPOINTS=(
    "/v1/completions"
    "/v1/chat/completions" 
    "/generate"
    "/completions"
    "/chat"
    "/api/v1/generate"
    "/api/v1/completions"
    "/api/generate"
    "/api/chat"
    "/query"
)

# Test each endpoint with both GET and POST methods
for endpoint in "${ENDPOINTS[@]}"; do
    echo -e "\nTesting $endpoint..."
    
    # Test GET request
    echo -n "GET: "
    STATUS=$(docker exec minimal-agent curl -s -o /dev/null -w "%{http_code}" http://crag-mock-api:8000$endpoint)
    echo "$STATUS"
    
    # Test POST request with standard JSON payload
    echo -n "POST: "
    STATUS=$(docker exec minimal-agent curl -s -o /dev/null -w "%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"prompt":"test"}' \
        http://crag-mock-api:8000$endpoint)
    
    if [ "$STATUS" == "200" ]; then
        echo "$STATUS ✅"
        echo "Testing full response from endpoint..."
        RESPONSE=$(docker exec minimal-agent curl -s \
            -X POST \
            -H "Content-Type: application/json" \
            -d '{"prompt":"What are your capabilities?"}' \
            http://crag-mock-api:8000$endpoint)
        echo "$RESPONSE"
        
        # Save this working endpoint
        echo -e "\n✅ Found working endpoint: $endpoint"
        WORKING_ENDPOINT="$endpoint"
        
        # Update the minimal agent to use the working endpoint
        echo "Updating minimal agent to use endpoint: $WORKING_ENDPOINT"
        UPDATE_SCRIPT=$(mktemp)
        cat > $UPDATE_SCRIPT << EOL
import re

# Find the main.py file
main_file = '/app/main.py'

with open(main_file, 'r') as f:
    content = f.read()

# Find the current endpoint URL pattern
url_pattern = r'http://[^/]+:[0-9]+/[^\'"]*'
match = re.search(url_pattern, content)

if match:
    old_url = match.group(0)
    # Extract the base URL (without the path)
    base_url = old_url.split('/')[0] + '//' + old_url.split('/')[2]
    new_url = base_url + '${WORKING_ENDPOINT}'
    
    # Replace the URL in the file
    new_content = content.replace(old_url, new_url)
    
    with open(main_file, 'w') as f:
        f.write(new_content)
    
    print(f"Updated main.py to use {new_url}")
else:
    print("Could not find API URL in main.py")
EOL
        
        docker cp $UPDATE_SCRIPT minimal-agent:/tmp/update_endpoint.py
        docker exec minimal-agent python /tmp/update_endpoint.py
        
        # Restart the minimal agent to apply changes
        echo "Restarting minimal agent to apply changes..."
        docker restart minimal-agent
        rm $UPDATE_SCRIPT
        
        echo -e "\nWaiting for container to restart..."
        sleep 5
        
        # Test if the change worked
        echo "Testing with the new endpoint..."
        curl -s -X POST -H "Content-Type: application/json" \
            -d '{"message":"What can you do?"}' \
            http://localhost:8000/api/chat | jq
            
        break
    else
        echo "$STATUS"
    fi
done

# If we get here without finding a working endpoint
if [ -z "$WORKING_ENDPOINT" ]; then
    echo -e "\n❌ No working endpoints found with standard payload"
    echo "Checking if OpenAPI documentation is available..."
    
    # Try to access OpenAPI documentation
    if docker exec minimal-agent curl -s -o /dev/null -w "%{http_code}" http://crag-mock-api:8000/docs | grep -q "200"; then
        echo "✅ OpenAPI documentation available at /docs"
        echo "Please check the documentation for available endpoints"
        echo "docker exec minimal-agent curl -s http://crag-mock-api:8000/openapi.json | jq"
    elif docker exec minimal-agent curl -s -o /dev/null -w "%{http_code}" http://crag-mock-api:8000/openapi.json | grep -q "200"; then
        echo "✅ OpenAPI specification available at /openapi.json"
        echo "Retrieving API specification..."
        docker exec minimal-agent curl -s http://crag-mock-api:8000/openapi.json > openapi.json
        echo "Saved to openapi.json - Examine this file to find the correct endpoints"
    else
        echo "❌ No API documentation found"
    fi
fi

echo -e "\nIf the automatic update didn't work, you can try the following endpoints directly:"
echo "1. Test from host: curl -X POST -H \"Content-Type: application/json\" -d '{\"prompt\":\"test\"}' http://localhost:8080<endpoint>\""
echo "2. Test from container: docker exec minimal-agent curl -X POST -H \"Content-Type: application/json\" -d '{\"prompt\":\"test\"}' http://crag-mock-api:8000<endpoint>\""
echo "Replace <endpoint> with one of the endpoints from the list above"
