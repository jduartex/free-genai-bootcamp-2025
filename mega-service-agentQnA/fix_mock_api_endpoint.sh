#!/bin/bash

echo "=========================================================="
echo "MOCK API ENDPOINT FIXER"
echo "=========================================================="
echo "This script will fix the 404 error when connecting to the Mock API"

# Check if both containers are running
if ! docker ps | grep -q "crag-mock-api"; then
    echo "❌ Mock API container is not running"
    echo "Please start it with: docker start crag-mock-api"
    exit 1
fi

if ! docker ps | grep -q "minimal-agent"; then
    echo "❌ Minimal agent container is not running"
    echo "Please start it with: docker start minimal-agent"
    exit 1
fi

# Get information about the Mock API
echo "Getting Mock API container information..."
MOCK_API_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' crag-mock-api)
echo "Mock API IP: $MOCK_API_IP"

# Create a temporary script to check available endpoints
echo "Checking available API endpoints..."
TEST_SCRIPT=$(mktemp)
cat > $TEST_SCRIPT << 'EOL'
import requests
import time
import json

# List of potential endpoints to check
BASE_ENDPOINTS = [
    "/v1/chat/completions",  # OpenAI compatible endpoint
    "/generate",             # Current endpoint that's failing
    "/api/generate",         # Common API structure
    "/v1/generate",          # Versioned API
    "/",                     # Root endpoint
    "/chat"                  # Simple chat endpoint
]

# Get the Mock API IP from environment or use default
import os
MOCK_API_IP = os.environ.get('MOCK_API_IP', '172.18.0.2')

print(f"Testing endpoints on Mock API at {MOCK_API_IP}:8000")
print("=============================================")

working_endpoints = []

# Function to test an endpoint with various HTTP methods
def test_endpoint(url, data=None):
    methods = ["GET", "POST"]
    results = []
    
    for method in methods:
        try:
            if method == "GET":
                response = requests.get(url, timeout=5)
            else:  # POST
                headers = {"Content-Type": "application/json"}
                payload = data or {"prompt": "test"}
                response = requests.post(url, headers=headers, json=payload, timeout=5)
                
            print(f"{method} {url}: {response.status_code}")
            
            if response.status_code < 400:  # Any successful response
                content_type = response.headers.get('Content-Type', '')
                content_preview = response.text[:100] if response.text else "No content"
                
                results.append({
                    "url": url,
                    "method": method,
                    "status": response.status_code,
                    "content_type": content_type,
                    "content_preview": content_preview
                })
                
                if "json" in content_type:
                    try:
                        json_data = response.json()
                        print(f"  JSON response: {json.dumps(json_data, indent=2)[:200]}...")
                    except:
                        print("  Could not parse JSON response")
                elif content_preview:
                    print(f"  Response: {content_preview}...")
                    
        except Exception as e:
            print(f"{method} {url}: Error - {str(e)}")
    
    return results

# Test root endpoint to check if API is responding
root_response = test_endpoint(f"http://{MOCK_API_IP}:8000/")
if not root_response:
    print("❌ API is not responding to basic requests. It might not be ready.")
    
print("\nTesting common API endpoints...")

# Try typical endpoints
for endpoint in BASE_ENDPOINTS:
    url = f"http://{MOCK_API_IP}:8000{endpoint}"
    results = test_endpoint(url)
    if results:
        working_endpoints.extend(results)

# If we have an openai-style endpoint, try with proper payload
openai_url = f"http://{MOCK_API_IP}:8000/v1/chat/completions"
openai_payload = {
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello, how are you?"}]
}
openai_results = test_endpoint(openai_url, openai_payload)
if openai_results:
    working_endpoints.extend(openai_results)

# Try discover/endpoint listing APIs
discovery_endpoints = [
    "/endpoints",
    "/api",
    "/api/endpoints", 
    "/swagger",
    "/docs",
    "/openapi.json"
]

for endpoint in discovery_endpoints:
    url = f"http://{MOCK_API_IP}:8000{endpoint}"
    results = test_endpoint(url)
    if results:
        print(f"💡 Found API documentation/discovery endpoint: {url}")

# Output findings
print("\n=== ENDPOINT TEST RESULTS ===")
if working_endpoints:
    print(f"Found {len(working_endpoints)} working endpoints:")
    for i, endpoint in enumerate(working_endpoints):
        print(f"{i+1}. {endpoint['method']} {endpoint['url']} - Status {endpoint['status']}")
        
    # Save the working endpoints to a file
    with open("/tmp/working_endpoints.json", "w") as f:
        json.dump(working_endpoints, f, indent=2)
    
    print("\nSaved working endpoints to /tmp/working_endpoints.json")
else:
    print("❌ No working endpoints found")

# Specific test for the generate endpoint
generate_url = f"http://{MOCK_API_IP}:8000/generate"
print(f"\nSpecific test for /generate endpoint:")
test_endpoint(generate_url, {"prompt": "test"})

generate_url = f"http://{MOCK_API_IP}:8000/v1/completions"
print(f"\nSpecific test for OpenAI compatible completions endpoint:")
test_endpoint(generate_url, {"prompt": "test", "model": "gpt-3.5-turbo"})
EOL

# Copy the script to the container and run it
docker cp $TEST_SCRIPT minimal-agent:/tmp/test_endpoints.py
docker exec -e MOCK_API_IP=$MOCK_API_IP minimal-agent python /tmp/test_endpoints.py

# Create a script to update the minimal agent with the correct endpoint
UPDATE_SCRIPT=$(mktemp)
cat > $UPDATE_SCRIPT << 'EOL'
import json
import os
import re

# Try to load the working endpoints file
try:
    with open('/tmp/working_endpoints.json', 'r') as f:
        endpoints = json.load(f)
except Exception as e:
    print(f"Could not load working endpoints: {e}")
    endpoints = []

# Default endpoints to try if no working ones found
MOCK_API_IP = os.environ.get('MOCK_API_IP', '172.18.0.2')
ENDPOINTS_TO_TRY = [
    f"http://{MOCK_API_IP}:8000/completions",
    f"http://{MOCK_API_IP}:8000/v1/completions", 
    f"http://{MOCK_API_IP}:8000/v1/chat/completions",
    f"http://{MOCK_API_IP}:8000/chat/completions",
    f"http://{MOCK_API_IP}:8000/api/generate",
    f"http://crag-mock-api:8000/completions",
    f"http://crag-mock-api:8000/v1/completions",
    f"http://crag-mock-api:8000/v1/chat/completions"
]

# Find main.py file
main_file = '/app/main.py'
if not os.path.exists(main_file):
    print(f"Error: {main_file} not found")
    exit(1)

# Read current content
with open(main_file, 'r') as f:
    content = f.read()

# Find current URL pattern
current_url_match = re.search(r'http://[^/]+:[0-9]+/[^\'"]+', content)
if current_url_match:
    current_url = current_url_match.group(0)
    print(f"Current Mock API URL: {current_url}")
else:
    current_url = f"http://{MOCK_API_IP}:8000/generate"
    print(f"Could not find current URL, using default: {current_url}")

# Find a working POST endpoint from test results
working_url = None
for endpoint in endpoints:
    if endpoint['method'] == 'POST' and endpoint['status'] < 400:
        working_url = endpoint['url']
        print(f"Found working endpoint: {working_url}")
        break

# If no working endpoint was found, use our list of common endpoints
if not working_url:
    print("No working endpoints found from tests, using alternatives")
    # Add the current URL with different paths to try
    base_url_parts = current_url.split('/')
    base_url = '/'.join(base_url_parts[:3])  # http://host:port
    
    for endpoint in ENDPOINTS_TO_TRY:
        print(f"Will try endpoint: {endpoint}")

# Create a modified version of main.py that tries multiple endpoints
# This is more resilient than just changing to one endpoint
modification = f"""
# Multiple endpoints to try
MOCK_API_ENDPOINTS = [
    "{current_url}",  # Keep current endpoint as fallback
"""

# Add working endpoints if found
if working_url:
    modification += f'    "{working_url}",  # Working endpoint from tests\n'

# Add additional endpoints to try
for endpoint in ENDPOINTS_TO_TRY:
    if endpoint != current_url and (not working_url or endpoint != working_url):
        modification += f'    "{endpoint}",  # Alternative endpoint\n'

modification += """]

# Function to try multiple endpoints
def call_mock_api(message):
    """Try multiple endpoints to find one that works"""
    for endpoint in MOCK_API_ENDPOINTS:
        try:
            logger.info(f"Trying endpoint: {endpoint}")
            response = requests.post(
                endpoint,
                json={"prompt": message},
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"Successful response from: {endpoint}")
                return response
                
            logger.warning(f"Endpoint {endpoint} returned status {response.status_code}")
        except Exception as e:
            logger.warning(f"Error with endpoint {endpoint}: {str(e)}")
            
    # If no endpoints worked, return None
    return None
"""

# Look for a good place to insert the modification
if "def find_working_mock_api" in content:
    # Already has dynamic discovery, update it
    modified_content = re.sub(
        r'MOCK_API_URLS = \[.*?\]',
        '\n'.join(modification.split('\n')[1:-1]),  # Just the URLs array
        content,
        flags=re.DOTALL
    )
elif "import requests" in content:
    # Add after imports
    import_section_end = content.find("\n\n", content.find("import requests"))
    if import_section_end > 0:
        modified_content = content[:import_section_end] + "\n" + modification + content[import_section_end:]
    else:
        modified_content = content.replace("import requests", "import requests\n" + modification)
    
    # Now replace any direct calls to the Mock API
    modified_content = re.sub(
        r'response = requests\.post\([^)]+/generate[^)]*\)',
        'response = call_mock_api(message)',
        modified_content
    )
else:
    print("Could not find a suitable place to insert the modification")
    exit(1)

# Write back the modified file
with open(main_file, 'w') as f:
    f.write(modified_content)

print("Updated main.py with multiple endpoint support")
print("The minimal agent will now try multiple endpoints until one works")
EOL

# Copy and run the update script
echo "Updating minimal agent to try multiple endpoints..."
docker cp $UPDATE_SCRIPT minimal-agent:/tmp/update_endpoints.py
docker exec -e MOCK_API_IP=$MOCK_API_IP minimal-agent python /tmp/update_endpoints.py

# Restart the minimal agent
echo "Restarting minimal agent to apply changes..."
docker restart minimal-agent

# Clean up temporary files
rm $TEST_SCRIPT $UPDATE_SCRIPT

# Wait for container to restart
echo "Waiting for minimal-agent to restart..."
sleep 5

# Test if fix worked
echo ""
echo "Testing if the fix worked..."
TEST_RESULT=$(curl -s -X POST -H "Content-Type: application/json" -d '{"message":"test message"}' http://localhost:8000/api/chat)

if echo "$TEST_RESULT" | grep -q "error\|Failed to"; then
    echo "❌ Test failed. The minimal agent is still having issues."
    echo "Response:"
    echo "$TEST_RESULT" | json_pp
    echo ""
    echo "Check both containers for more information:"
    echo "- docker logs minimal-agent"
    echo "- docker logs crag-mock-api"
else
    echo "✅ Test succeeded! The minimal agent should now be able to communicate with the Mock API."
    echo "Response:"
    echo "$TEST_RESULT" | json_pp
fi

echo ""
echo "If you're still having issues, check if the Mock API is fully initialized:"
echo "- docker logs crag-mock-api | grep -A 5 'Application startup complete'"
echo ""
echo "You can also try running these commands to get more debug information:"
echo "- docker exec minimal-agent curl -v http://crag-mock-api:8000/"
echo "- docker exec minimal-agent curl -v -X POST -H 'Content-Type: application/json' -d '{\"prompt\":\"test\"}' http://crag-mock-api:8000/v1/completions"
echo "- docker exec minimal-agent curl -v -X POST -H 'Content-Type: application/json' -d '{\"prompt\":\"test\"}' http://crag-mock-api:8000/api/generate"
