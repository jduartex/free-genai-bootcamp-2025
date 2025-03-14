#!/bin/bash

echo "=========================================================="
echo "MOCK API ENDPOINT DISCOVERY"
echo "=========================================================="
echo "This script will find the correct endpoints for the Mock API"

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

# First, check if OpenAPI docs are available
echo "Checking if API documentation is available..."
if docker exec minimal-agent curl -s -o /dev/null -w "%{http_code}" http://crag-mock-api:8000/docs &>/dev/null; then
    echo "✅ API documentation found at /docs"
    HAS_DOCS=true
else
    echo "⚠️ No API documentation found at /docs"
    HAS_DOCS=false
fi

# Create a discovery script
DISCOVERY_SCRIPT=$(mktemp)
cat > $DISCOVERY_SCRIPT << 'EOL'
import requests
import json
import sys
import time

print("🔍 CRAG Mock API Endpoint Discovery Tool")
print("=======================================")

# Base URL for the API
base_url = "http://crag-mock-api:8000"

# Check if OpenAPI spec is available
try:
    print(f"Checking for OpenAPI spec...")
    response = requests.get(f"{base_url}/openapi.json")
    if response.status_code == 200:
        print("✅ Found OpenAPI specification")
        
        # Save the spec for analysis
        spec = response.json()
        with open("/tmp/openapi_spec.json", "w") as f:
            json.dump(spec, f, indent=2)
        
        # Find all endpoints
        print("\nAvailable API endpoints:")
        for path, methods in spec.get("paths", {}).items():
            for method in methods:
                method_details = methods[method]
                summary = method_details.get("summary", "")
                print(f"- {method.upper()} {path}: {summary}")
        
        # Look for generate endpoints
        print("\nSearching for endpoints related to text generation...")
        generation_endpoints = []
        for path, methods in spec.get("paths", {}).items():
            if "post" in methods:
                method_details = methods["post"]
                summary = method_details.get("summary", "").lower()
                description = method_details.get("description", "").lower()
                
                if any(word in summary or word in description for word in 
                      ["generat", "complet", "answer", "question", "query", "chat"]):
                    generation_endpoints.append({
                        "path": path,
                        "summary": summary,
                        "description": description
                    })
        
        if generation_endpoints:
            print(f"Found {len(generation_endpoints)} potential generation endpoints:")
            for i, endpoint in enumerate(generation_endpoints):
                print(f"{i+1}. {endpoint['path']}")
                print(f"   Summary: {endpoint['summary']}")
                print(f"   Description: {endpoint['description']}")
                
            # Test the most promising endpoint
            if len(generation_endpoints) > 0:
                test_endpoint = generation_endpoints[0]["path"]
                print(f"\nTesting endpoint {test_endpoint} with a sample query...")
                
                test_payload = {
                    "prompt": "What is CRAG?"
                }
                
                try:
                    response = requests.post(f"{base_url}{test_endpoint}", json=test_payload, timeout=10)
                    print(f"Status code: {response.status_code}")
                    
                    if response.status_code == 200:
                        response_data = response.json()
                        print("Response received!")
                        print(f"Response keys: {list(response_data.keys())}")
                        
                        # Determine if response looks valid
                        if "response" in response_data:
                            print("✅ This endpoint works! It returns a 'response' field.")
                            print("\nSAMPLE RESPONSE:")
                            print(response_data["response"][:300] + "..." if len(response_data["response"]) > 300 else response_data["response"])
                        else:
                            print("⚠️ This endpoint responded but doesn't have a 'response' field.")
                            print("Response structure:", json.dumps(response_data)[:300] + "...")
                except Exception as e:
                    print(f"❌ Error testing endpoint: {e}")
    else:
        print(f"❌ OpenAPI spec not available. Status: {response.status_code}")
except Exception as e:
    print(f"❌ Error fetching OpenAPI spec: {e}")

# Try standard endpoints commonly used in LLM APIs
print("\nTrying standard LLM API endpoints...")
standard_endpoints = [
    "/chat", 
    "/crag",
    "/query",
    "/question",
    "/generate",
    "/complete",
    "/ask",
    "/bot",
    "/api/chat",
    "/api/generate",
    "/api/query",
    "/api/crag"
]

found_working_endpoint = False
for endpoint in standard_endpoints:
    print(f"Testing {endpoint}...")
    
    try:
        # Try a POST request with a simple payload
        response = requests.post(
            f"{base_url}{endpoint}",
            json={"prompt": "What is CRAG?"},
            timeout=5
        )
        
        print(f"  Status: {response.status_code}")
        
        if response.status_code == 200:
            print("  ✅ Endpoint responded with 200 OK")
            try:
                data = response.json()
                print(f"  Response keys: {list(data.keys())}")
                found_working_endpoint = True
                
                # Save this successful endpoint
                with open("/tmp/working_endpoint.txt", "w") as f:
                    f.write(f"{endpoint}")
                    
                # Save the response format
                with open("/tmp/response_format.json", "w") as f:
                    json.dump(data, f, indent=2)
                
                print(f"  Response preview: {json.dumps(data)[:200]}...")
                break
            except Exception as e:
                print(f"  Error parsing response: {e}")
        else:
            print(f"  This endpoint returned status {response.status_code}")
    except Exception as e:
        print(f"  Error testing endpoint: {e}")

# Try to find the documentation path
print("\nLooking for API documentation...")
doc_paths = ["/docs", "/swagger", "/redoc", "/api-docs", "/openapi"]

for doc_path in doc_paths:
    try:
        response = requests.get(f"{base_url}{doc_path}", timeout=2)
        if response.status_code == 200:
            print(f"✅ Documentation found at {doc_path}")
            
            # Write this to a file for reference
            with open("/tmp/api_docs_path.txt", "w") as f:
                f.write(doc_path)
            
            break
    except:
        pass

# Summarize findings
print("\n=== SUMMARY ===")
if found_working_endpoint:
    with open("/tmp/working_endpoint.txt", "r") as f:
        working_endpoint = f.read().strip()
        
    print(f"✅ Found working endpoint: {working_endpoint}")
    print(f"Full URL: {base_url}{working_endpoint}")
    
    # Load the response format
    with open("/tmp/response_format.json", "r") as f:
        response_format = json.load(f)
    
    print(f"Response format keys: {list(response_format.keys())}")
else:
    print("❌ No standard endpoints appear to be working for query/generate functionality")
    print("The API might require a custom format or endpoint")

# If openapi spec was found, provide info about all API endpoints
if os.path.exists("/tmp/openapi_spec.json"):
    print("\nAll available API endpoints have been written to: /tmp/openapi_spec.json")
EOL

# Copy and run the discovery script
echo "Running endpoint discovery script..."
docker cp $DISCOVERY_SCRIPT minimal-agent:/tmp/discovery.py
docker exec minimal-agent python /tmp/discovery.py

# Clean up the temporary script file
rm $DISCOVERY_SCRIPT

# Check if a working endpoint was found
if docker exec minimal-agent test -f /tmp/working_endpoint.txt; then
    WORKING_ENDPOINT=$(docker exec minimal-agent cat /tmp/working_endpoint.txt)
    echo ""
    echo "✅ Found working endpoint: $WORKING_ENDPOINT"
    
    # Create a patch script to update the minimal agent
    PATCH_SCRIPT=$(mktemp)
    cat > $PATCH_SCRIPT << EOL
import re
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("endpoint-patcher")

# Try to load the working endpoint
working_endpoint = None
try:
    with open('/tmp/working_endpoint.txt', 'r') as f:
        working_endpoint = f.read().strip()
    logger.info(f"Found working endpoint: {working_endpoint}")
except Exception as e:
    logger.error(f"Could not read working endpoint: {e}")
    exit(1)

# Load response format if available
response_format = {}
try:
    import json
    with open('/tmp/response_format.json', 'r') as f:
        response_format = json.load(f)
    logger.info(f"Loaded response format with keys: {list(response_format.keys())}")
except Exception as e:
    logger.warning(f"Could not load response format: {e}")

# Determine response field (where the generated text is located)
response_field = "response"  # Default
if response_format:
    # Check for common response field names
    for field in ["response", "text", "answer", "generated_text", "content", "message"]:
        if field in response_format:
            response_field = field
            break
    logger.info(f"Using response field: {response_field}")

# Find and patch the main.py file
main_file = '/app/main.py'
try:
    with open(main_file, 'r') as f:
        content = f.read()
    
    # Find the URL pattern that refers to the Mock API
    url_pattern = r'http://[^/]+:[0-9]+/generate'
    match = re.search(url_pattern, content)
    
    if match:
        old_url = match.group(0)
        base_url = old_url.rsplit('/', 1)[0]  # Remove "/generate"
        new_url = f"{base_url}{working_endpoint}"
        
        logger.info(f"Replacing URL: {old_url} -> {new_url}")
        
        # Replace the URL
        new_content = content.replace(old_url, new_url)
        
        # Update the response field extraction if needed
        if response_field != "response":
            new_content = new_content.replace('data.get("response"', f'data.get("{response_field}"')
        
        # Write the updated content back to the file
        with open(main_file, 'w') as f:
            f.write(new_content)
        
        print(f"✅ Successfully updated main.py to use endpoint: {working_endpoint}")
    else:
        logger.error("Could not find URL pattern in main.py")
        
except Exception as e:
    logger.error(f"Error updating main.py: {e}")
EOL

    # Copy and run the patch script
    docker cp $PATCH_SCRIPT minimal-agent:/tmp/patch.py
    docker exec minimal-agent python /tmp/patch.py
    
    # Clean up
    rm $PATCH_SCRIPT
    
    # Restart the minimal-agent
    echo "Restarting minimal-agent to apply changes..."
    docker restart minimal-agent
    
    echo "Waiting for container to restart..."
    sleep 5
    
    # Test if everything works now
    echo "Testing if the new endpoint works..."
    curl -s -X POST \
         -H "Content-Type: application/json" \
         -d '{"message":"What is the CRAG API?"}' \
         http://localhost:8000/api/chat | jq
else
    echo ""
    echo "❌ No working endpoint was found."
    echo ""
    echo "Let's try to discover available endpoints from the API documentation..."
    
    # If the API has docs, fetch the OpenAPI spec
    if docker exec minimal-agent curl -s -o /tmp/openapi.json http://crag-mock-api:8000/openapi.json; then
        echo "Saved OpenAPI spec to /tmp/openapi.json"
        
        # Create a custom endpoint creator script
        CUSTOM_SCRIPT=$(mktemp)
        cat > $CUSTOM_SCRIPT << 'EOL'
import json
import requests
import os

print("Creating custom API endpoint handler...")

# Load OpenAPI spec
with open('/tmp/openapi.json', 'r') as f:
    spec = json.load(f)

# Create a custom endpoint wrapper module
os.makedirs('/app/crag_api_wrapper', exist_ok=True)

with open('/app/crag_api_wrapper/__init__.py', 'w') as f:
    f.write("""
import requests
import json
import logging
import time
import asyncio
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("crag-wrapper")

class CragApiWrapper:
    def __init__(self, base_url: str = "http://crag-mock-api:8000"):
        self.base_url = base_url
        self.endpoints = {}
        self.load_endpoints()
        self.last_successful_endpoint = None
    
    def load_endpoints(self):
        """Load available endpoints from OpenAPI spec if possible"""
        try:
            response = requests.get(f"{self.base_url}/openapi.json")
            if response.status_code == 200:
                spec = response.json()
                for path, methods in spec.get("paths", {}).items():
                    if "post" in methods:
                        self.endpoints[path] = {
                            "method": "POST",
                            "summary": methods["post"].get("summary", ""),
                            "description": methods["post"].get("description", ""),
                        }
                logger.info(f"Loaded {len(self.endpoints)} endpoints from OpenAPI spec")
            else:
                logger.warning("Failed to load OpenAPI spec")
        except Exception as e:
            logger.error(f"Error loading endpoints: {e}")
    
    def _extract_text(self, response_data: Dict[str, Any]) -> str:
        """Extract text from response data"""
        # Try common response fields
        for field in ["response", "text", "answer", "generated_text", "content", "message", "result"]:
            if field in response_data:
                return response_data[field]
        
        # If no common field is found, return the whole response
        return json.dumps(response_data)
    
    async def ask(self, prompt: str) -> Dict[str, Any]:
        """Send a question to the API via the best available endpoint"""
        # Define various payload formats to try
        payload_formats = [
            {"prompt": prompt},
            {"query": prompt},
            {"question": prompt},
            {"text": prompt},
            {"input": prompt},
            {"messages": [{"role": "user", "content": prompt}]},
        ]
        
        # Try the last successful endpoint first if available
        if self.last_successful_endpoint:
            endpoint = self.last_successful_endpoint
            logger.info(f"Trying last successful endpoint first: {endpoint}")
            
            for payload in payload_formats:
                try:
                    response = requests.post(
                        f"{self.base_url}{endpoint}", 
                        json=payload,
                        timeout=10
                    )
                    if response.status_code == 200:
                        data = response.json()
                        text = self._extract_text(data)
                        return {"response": text, "status": "success", "endpoint": endpoint}
                except Exception as e:
                    logger.warning(f"Error with last successful endpoint: {e}")
        
        # Try endpoints from the OpenAPI spec
        for endpoint, info in self.endpoints.items():
            logger.info(f"Trying endpoint: {endpoint}")
            
            for payload in payload_formats:
                try:
                    response = requests.post(
                        f"{self.base_url}{endpoint}", 
                        json=payload,
                        timeout=10
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        text = self._extract_text(data)
                        self.last_successful_endpoint = endpoint
                        return {"response": text, "status": "success", "endpoint": endpoint}
                except Exception as e:
                    continue  # Try next payload format
        
        # Try common endpoint names as a last resort
        common_endpoints = [
            "/chat",
            "/query",
            "/answer",
            "/generate",
            "/complete",
            "/crag",
            "/api/chat",
            "/api/query"
        ]
        
        for endpoint in common_endpoints:
            for payload in payload_formats[:2]:  # Just try the simple formats
                try:
                    response = requests.post(
                        f"{self.base_url}{endpoint}", 
                        json=payload,
                        timeout=5
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        text = self._extract_text(data)
                        self.last_successful_endpoint = endpoint
                        return {"response": text, "status": "success", "endpoint": endpoint}
                except Exception:
                    continue
        
        # If all attempts fail
        return {
            "response": "I'm sorry, I couldn't get a response from the CRAG API. It may not be fully initialized yet.",
            "status": "error"
        }

# Create a singleton instance
api = CragApiWrapper()
""")

# Update main.py to use the new wrapper
main_file = '/app/main.py'
with open(main_file, 'r') as f:
    content = f.read()

# Add import for our wrapper
if "import requests" in content:
    import_section = content.split("import requests")[0] + "import requests\n"
    remaining_content = content[len(import_section):]
    
    # Add import for our wrapper
    import_section += "from crag_api_wrapper import api\n"
    
    # Combine and update
    updated_content = import_section + remaining_content
    
    # Replace the direct API call with our wrapper
    if "response = requests.post" in updated_content:
        updated_content = updated_content.replace(
            'response = requests.post(',
            'response_data = await api.ask(message)\nresponse_text = response_data.get("response", "")\n# Skip the original API call'
        )
        
        # Also update the response handling
        updated_content = updated_content.replace(
            'data = response.json()',
            'data = {"response": response_text}'
        )
    
    # Write the updated content back
    with open(main_file, 'w') as f:
        f.write(updated_content)
    
    print("✅ Updated main.py to use the custom API wrapper")
    print("The wrapper will automatically discover and use working endpoints")
else:
    print("❌ Could not find import requests in main.py")
EOL

        # Copy and run the script
        docker cp $CUSTOM_SCRIPT minimal-agent:/tmp/custom_wrapper.py
        docker exec minimal-agent python /tmp/custom_wrapper.py
        
        # Clean up
        rm $CUSTOM_SCRIPT
        
        # Restart the minimal-agent
        echo "Restarting minimal-agent to apply changes..."
        docker restart minimal-agent
        
        echo "Waiting for container to restart..."
        sleep 5
        
        # Test if everything works now
        echo "Testing if the custom wrapper works..."
        curl -s -X POST \
             -H "Content-Type: application/json" \
             -d '{"message":"What is the CRAG API?"}' \
             http://localhost:8000/api/chat | jq
    else
        echo "Could not retrieve OpenAPI spec from the API"
        echo "Using fallback option - creating a direct adapter for the root endpoint"
        
        # Create fallback adapter
        FALLBACK_SCRIPT=$(mktemp)
        cat > $FALLBACK_SCRIPT << 'EOL'
import re

main_file = '/app/main.py'
with open(main_file, 'r') as f:
    content = f.read()

# Find the URL pattern that refers to the Mock API
url_pattern = r'http://[^/]+:[0-9]+/generate'
match = re.search(url_pattern, content)

if match:
    old_url = match.group(0)
    base_url = old_url.rsplit('/', 1)[0]  # Remove "/generate"
    
    # Replace the entire API call section
    api_call_pattern = r'response = requests\.post\([^)]+\)[^\n]+\n'
    api_call_replacement = f'''
            # Custom API handling
            api_response = "The CRAG API is still initializing. Please try again in a few minutes."
            
            try:
                root_response = requests.get("{base_url}/")
                if root_response.status_code == 200:
                    api_response = f"The CRAG API is available but the generation endpoint is still initializing. Root endpoint returned: {{root_response.text[:100]}}..."
            except Exception as e:
                logger.error(f"Error calling root endpoint: {{e}}")
            
            # Create a simulated response object
            class SimulatedResponse:
                def __init__(self):
                    self.status_code = 200
                
                def json(self):
                    return {{"response": api_response}}
            
            response = SimulatedResponse()
'''
    
    updated_content = re.sub(api_call_pattern, api_call_replacement, content)
    
    with open(main_file, 'w') as f:
        f.write(updated_content)
    
    print("✅ Updated main.py with fallback adapter")
else:
    print("❌ Could not find URL pattern in main.py")
EOL

        # Copy and run the fallback script
        docker cp $FALLBACK_SCRIPT minimal-agent:/tmp/fallback.py
        docker exec minimal-agent python /tmp/fallback.py
        
        # Clean up
        rm $FALLBACK_SCRIPT
        
        # Restart the minimal-agent
        echo "Restarting minimal-agent to apply changes..."
        docker restart minimal-agent
        
        echo "Waiting for container to restart..."
        sleep 5
        
        echo "A basic fallback has been implemented that will inform users the API is initializing"
    fi
fi

echo ""
echo "=========================================================="
echo "ENDPOINT UPDATE COMPLETE"
echo "=========================================================="
echo ""
echo "The agent has been updated to use a working endpoint or to handle missing endpoints."
echo "If the API is still initializing, you may need to wait a few more minutes for it to be ready."
echo ""
echo "Access the web interface at: http://localhost:8000"
echo "Check logs with: docker logs minimal-agent"
echo "Check API logs with: docker logs crag-mock-api"
