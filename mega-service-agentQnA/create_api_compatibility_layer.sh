#!/bin/bash

echo "=========================================================="
echo "MOCK API COMPATIBILITY LAYER CREATOR"
echo "=========================================================="
echo "This script will create a proxy to handle the API format conversion"

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

# First, retrieve the OpenAPI spec to analyze the API structure
echo "Retrieving OpenAPI specification from the Mock API..."

# Create a temporary directory for our files
TEMP_DIR=$(mktemp -d)
echo "Using temporary directory: $TEMP_DIR"

# Create a script to analyze the OpenAPI spec
cat > $TEMP_DIR/analyze_api.py << 'EOL'
import requests
import json
import sys

# Try to get the OpenAPI specification
try:
    response = requests.get("http://crag-mock-api:8000/openapi.json", timeout=5)
    if response.status_code != 200:
        print(f"Failed to get OpenAPI spec: Status code {response.status_code}")
        sys.exit(1)
    
    api_spec = response.json()
    print("✅ Successfully retrieved OpenAPI specification")
    
    # Save it for reference
    with open("/tmp/openapi.json", "w") as f:
        json.dump(api_spec, f, indent=2)
        print("Saved OpenAPI spec to /tmp/openapi.json")
    
    # Analyze the paths to find endpoints that look like they could handle prompts
    print("\n=== ANALYZING API ENDPOINTS ===")
    
    potential_endpoints = []
    
    for path, methods in api_spec.get("paths", {}).items():
        for method, details in methods.items():
            if method.lower() == "post":  # We're looking for POST endpoints
                summary = details.get("summary", "")
                description = details.get("description", "")
                tags = details.get("tags", [])
                
                # Check if this looks like a text generation endpoint
                is_potential_endpoint = (
                    "generat" in summary.lower() or
                    "complet" in summary.lower() or
                    "chat" in summary.lower() or
                    "prompt" in summary.lower() or
                    "generat" in description.lower() or
                    "complet" in description.lower() or
                    "prompt" in description.lower() or
                    any("generat" in tag.lower() for tag in tags) or
                    any("complet" in tag.lower() for tag in tags) or
                    any("chat" in tag.lower() for tag in tags)
                )
                
                if is_potential_endpoint:
                    # Extract expected request body structure
                    request_body = {}
                    if "requestBody" in details:
                        content = details["requestBody"].get("content", {})
                        if "application/json" in content:
                            schema = content["application/json"].get("schema", {})
                            if "properties" in schema:
                                request_body = schema["properties"]
                    
                    potential_endpoints.append({
                        "path": path,
                        "method": method.upper(),
                        "summary": summary,
                        "description": description,
                        "tags": tags,
                        "request_body": request_body
                    })
    
    if not potential_endpoints:
        print("⚠️ No potential prompt handling endpoints found in the API spec.")
        # Fallback to just listing all POST endpoints
        print("Listing all POST endpoints instead:")
        for path, methods in api_spec.get("paths", {}).items():
            for method, details in methods.items():
                if method.lower() == "post":
                    potential_endpoints.append({
                        "path": path,
                        "method": method.upper(),
                        "summary": details.get("summary", ""),
                        "description": details.get("description", ""),
                        "tags": details.get("tags", []),
                        "request_body": {}
                    })
    
    # If still no endpoints, list all endpoints
    if not potential_endpoints:
        print("⚠️ No POST endpoints found in the API spec.")
        print("Listing all endpoints:")
        for path, methods in api_spec.get("paths", {}).items():
            for method, details in methods.items():
                potential_endpoints.append({
                    "path": path,
                    "method": method.upper(),
                    "summary": details.get("summary", ""),
                    "description": details.get("description", ""),
                    "tags": details.get("tags", []),
                    "request_body": {}
                })
    
    # Save the potential endpoints for the compatibility layer
    with open("/tmp/potential_endpoints.json", "w") as f:
        json.dump(potential_endpoints, f, indent=2)
    
    # Display found endpoints
    print(f"Found {len(potential_endpoints)} potential endpoints:")
    for i, endpoint in enumerate(potential_endpoints):
        print(f"{i+1}. {endpoint['method']} {endpoint['path']}")
        print(f"   Summary: {endpoint['summary']}")
        if endpoint['request_body']:
            print(f"   Expected request fields: {list(endpoint['request_body'].keys())}")
    
    # Test all discovered POST endpoints with a basic prompt
    print("\n=== TESTING ENDPOINTS ===")
    test_results = []
    
    for endpoint in potential_endpoints:
        if endpoint['method'] != "POST":
            continue
        
        url = f"http://crag-mock-api:8000{endpoint['path']}"
        print(f"Testing {endpoint['method']} {url}")
        
        # Determine the most likely parameter name for the prompt
        prompt_param = "prompt"  # Default
        if endpoint['request_body']:
            # Look for common prompt parameter names
            for param in ["prompt", "text", "message", "input", "query", "q", "content"]:
                if param in endpoint['request_body']:
                    prompt_param = param
                    break
        
        # Try to construct an appropriate request body
        request_body = {prompt_param: "Hello, this is a test prompt"}
        
        # For OpenAI-like endpoints, try a different format
        if "chat/completions" in endpoint['path'] or "openai" in endpoint['path'].lower():
            request_body = {
                "model": "gpt-3.5-turbo",  # Commonly expected parameter
                "messages": [
                    {"role": "user", "content": "Hello, this is a test prompt"}
                ]
            }
        
        try:
            response = requests.post(url, json=request_body, timeout=10)
            print(f"Status: {response.status_code}")
            
            content_type = response.headers.get('Content-Type', '')
            try:
                if "json" in content_type:
                    resp_json = response.json()
                    print(f"JSON Response preview: {json.dumps(resp_json)[:200]}...")
                    
                    # Check if this looks like it might have generated text
                    contains_text = False
                    if isinstance(resp_json, dict):
                        for key in ["response", "text", "message", "content", "output", "generated_text", "choices"]:
                            if key in resp_json:
                                contains_text = True
                                break
                    
                    if response.status_code < 400 and contains_text:
                        test_results.append({
                            "endpoint": endpoint['path'],
                            "status": response.status_code,
                            "request_format": request_body,
                            "response_format": resp_json,
                            "seems_valid": True
                        })
                    elif response.status_code < 400:
                        test_results.append({
                            "endpoint": endpoint['path'],
                            "status": response.status_code,
                            "request_format": request_body,
                            "response_format": resp_json,
                            "seems_valid": False
                        })
                else:
                    print(f"Non-JSON Response: {response.text[:200]}...")
            except Exception as e:
                print(f"Error parsing response: {e}")
        except Exception as e:
            print(f"Error testing endpoint: {e}")
    
    # Save the test results
    with open("/tmp/endpoint_tests.json", "w") as f:
        json.dump(test_results, f, indent=2)
    
    # Find the best endpoint to use
    if test_results:
        valid_endpoints = [e for e in test_results if e["seems_valid"]]
        if valid_endpoints:
            best_endpoint = valid_endpoints[0]
            print(f"\n✅ Found a working endpoint: {best_endpoint['endpoint']}")
            print(f"Request format: {json.dumps(best_endpoint['request_format'], indent=2)}")
            
            # Extract the response field that contains the generated text
            response_field = None
            if isinstance(best_endpoint['response_format'], dict):
                for field in ["response", "text", "message", "content", "output", "generated_text"]:
                    if field in best_endpoint['response_format']:
                        response_field = field
                        break
                # Handle nested fields like choices[0].message.content in OpenAI API
                if "choices" in best_endpoint['response_format'] and isinstance(best_endpoint['response_format']["choices"], list):
                    if best_endpoint['response_format']["choices"] and isinstance(best_endpoint['response_format']["choices"][0], dict):
                        if "text" in best_endpoint['response_format']["choices"][0]:
                            response_field = "choices[0].text"
                        elif "message" in best_endpoint['response_format']["choices"][0]:
                            if isinstance(best_endpoint['response_format']["choices"][0]["message"], dict):
                                if "content" in best_endpoint['response_format']["choices"][0]["message"]:
                                    response_field = "choices[0].message.content"
            
            print(f"Response field containing text: {response_field}")
            
            with open("/tmp/best_endpoint.json", "w") as f:
                json.dump({
                    "endpoint": best_endpoint['endpoint'],
                    "request_format": best_endpoint['request_format'],
                    "response_field": response_field
                }, f, indent=2)
        else:
            print("⚠️ No endpoints found that seem to work properly for text generation")
    else:
        print("⚠️ No endpoints were successfully tested")

except Exception as e:
    print(f"❌ Error analyzing the API: {e}")
    sys.exit(1)
EOL

# Create a proxy module that will serve as the compatibility layer
cat > $TEMP_DIR/api_proxy.py << 'EOL'
import requests
import json
import os
import logging
from typing import Dict, Any, Optional, List, Union

# Configure logging
logger = logging.getLogger("api-proxy")

class MockAPIProxy:
    """Compatibility layer for the Mock API"""
    
    def __init__(self):
        self.best_endpoint = None
        self.request_format = None
        self.response_field = None
        self.api_base_url = "http://crag-mock-api:8000"
        self.fallback_endpoints = [
            "/v1/chat/completions",
            "/v1/completions",
            "/chat",
            "/generate",
            "/api/generate",
            "/v1/generate"
        ]
        
        # Try to load the best endpoint from our analysis
        try:
            if os.path.exists("/tmp/best_endpoint.json"):
                with open("/tmp/best_endpoint.json", "r") as f:
                    endpoint_data = json.load(f)
                    self.best_endpoint = endpoint_data.get("endpoint")
                    self.request_format = endpoint_data.get("request_format", {})
                    self.response_field = endpoint_data.get("response_field")
                    logger.info(f"Loaded best endpoint configuration: {self.best_endpoint}")
        except Exception as e:
            logger.error(f"Error loading best endpoint data: {e}")
    
    def _extract_text_from_response(self, response_data: Dict[str, Any]) -> str:
        """Extract generated text from the API response based on its format"""
        if not isinstance(response_data, dict):
            return str(response_data)
        
        # If we know which field contains the response, use that
        if self.response_field:
            if "." in self.response_field:
                # Handle nested fields like choices[0].message.content
                parts = self.response_field.split(".")
                current = response_data
                for part in parts:
                    # Handle array indices like choices[0]
                    if "[" in part and "]" in part:
                        array_name, idx = part.split("[")
                        idx = int(idx.replace("]", ""))
                        if array_name in current and len(current[array_name]) > idx:
                            current = current[array_name][idx]
                        else:
                            return "Could not extract text from nested array response"
                    elif part in current:
                        current = current[part]
                    else:
                        return "Could not extract text from nested response"
                return str(current)
            elif self.response_field in response_data:
                return str(response_data[self.response_field])
        
        # Try common response fields
        for field in ["response", "text", "message", "content", "output", "generated_text", "result", "answer"]:
            if field in response_data:
                return str(response_data[field])
        
        # Handle OpenAI style responses
        if "choices" in response_data and isinstance(response_data["choices"], list) and len(response_data["choices"]) > 0:
            choice = response_data["choices"][0]
            if isinstance(choice, dict):
                if "text" in choice:
                    return choice["text"]
                elif "message" in choice and isinstance(choice["message"], dict):
                    if "content" in choice["message"]:
                        return choice["message"]["content"]
        
        # If we can't find a field that looks like it contains generated text, return the full response
        return json.dumps(response_data)
    
    def _create_request_body(self, prompt: str) -> Dict[str, Any]:
        """Create an appropriate request body based on the API's expectations"""
        if self.request_format:
            # Start with the format we determined from testing
            request_body = self.request_format.copy()
            
            # Update the prompt value without changing the structure
            if "messages" in request_body and isinstance(request_body["messages"], list):
                # Handle OpenAI-style format with messages array
                for i, msg in enumerate(request_body["messages"]):
                    if isinstance(msg, dict) and "content" in msg:
                        request_body["messages"][i]["content"] = prompt
                        break
            else:
                # Find and replace the prompt field
                for field in ["prompt", "text", "message", "input", "query", "q", "content"]:
                    if field in request_body:
                        request_body[field] = prompt
                        break
            
            return request_body
        else:
            # We don't have a known format, so try some common ones
            if "/chat/completions" in self.best_endpoint:
                # OpenAI style
                return {
                    "model": "gpt-3.5-turbo",
                    "messages": [{"role": "user", "content": prompt}]
                }
            else:
                # Simple prompt
                return {"prompt": prompt}
    
    async def generate(self, prompt: str) -> Dict[str, Any]:
        """Generate a response for the given prompt"""
        if not prompt:
            return {"response": "Empty prompt received", "error": True}
        
        # Use the best endpoint if we found one
        if self.best_endpoint:
            try:
                url = f"{self.api_base_url}{self.best_endpoint}"
                logger.info(f"Using best endpoint: {url}")
                
                request_body = self._create_request_body(prompt)
                logger.info(f"Request body: {json.dumps(request_body)}")
                
                response = requests.post(
                    url,
                    json=request_body,
                    timeout=30
                )
                
                if response.status_code == 200:
                    try:
                        response_data = response.json()
                        text = self._extract_text_from_response(response_data)
                        return {
                            "response": text,
                            "raw_response": response_data,
                            "status": "success"
                        }
                    except Exception as e:
                        logger.error(f"Error processing response: {e}")
                else:
                    logger.warning(f"API returned status {response.status_code}: {response.text}")
            except Exception as e:
                logger.error(f"Error generating with best endpoint: {e}")
        
        # If we get here, either we don't have a best endpoint or it failed
        # Try the fallback endpoints
        for endpoint in self.fallback_endpoints:
            try:
                url = f"{self.api_base_url}{endpoint}"
                logger.info(f"Trying fallback endpoint: {url}")
                
                # Try simple prompt format first
                response = requests.post(
                    url,
                    json={"prompt": prompt},
                    timeout=10
                )
                
                if response.status_code == 200:
                    try:
                        response_data = response.json()
                        text = self._extract_text_from_response(response_data)
                        # Save this as the best endpoint for future use
                        self.best_endpoint = endpoint
                        self.request_format = {"prompt": prompt}
                        return {
                            "response": text,
                            "raw_response": response_data,
                            "status": "success"
                        }
                    except Exception as e:
                        logger.error(f"Error processing fallback response: {e}")
                
                # If that didn't work, try OpenAI style
                response = requests.post(
                    url,
                    json={
                        "model": "gpt-3.5-turbo",
                        "messages": [{"role": "user", "content": prompt}]
                    },
                    timeout=10
                )
                
                if response.status_code == 200:
                    try:
                        response_data = response.json()
                        text = self._extract_text_from_response(response_data)
                        # Save this as the best endpoint for future use
                        self.best_endpoint = endpoint
                        self.request_format = {
                            "model": "gpt-3.5-turbo",
                            "messages": [{"role": "user", "content": "placeholder"}]
                        }
                        return {
                            "response": text,
                            "raw_response": response_data,
                            "status": "success"
                        }
                    except Exception as e:
                        logger.error(f"Error processing OpenAI fallback response: {e}")
            except Exception as e:
                logger.error(f"Error with fallback endpoint {endpoint}: {e}")
        
        # If all else fails, return an error
        return {
            "response": "Could not generate a response. The API may not be fully initialized or the endpoint structure is unknown.",
            "status": "error"
        }

# Create a singleton instance
proxy = MockAPIProxy()
EOL

# Create a script to install the compatibility layer in the minimal agent
cat > $TEMP_DIR/install_proxy.py << 'EOL'
import os
import re
import shutil

# Create the directory for the proxy module
os.makedirs("/app/api_proxy", exist_ok=True)

# Copy the proxy file
shutil.copy("/tmp/api_proxy.py", "/app/api_proxy/__init__.py")

# Create a simple setup file
with open("/app/api_proxy/__main__.py", "w") as f:
    f.write("""
import sys
from . import proxy
print("API Proxy module loaded successfully")
""")

# Create a test file for the proxy
with open("/app/test_proxy.py", "w") as f:
    f.write("""
import asyncio
from api_proxy import proxy

async def test_proxy():
    print("Testing API proxy...")
    result = await proxy.generate("Hello, this is a test prompt")
    print(f"Result: {result}")

if __name__ == "__main__":
    asyncio.run(test_proxy())
""")

# Now update main.py to use the proxy
main_file = '/app/main.py'
if not os.path.exists(main_file):
    print(f"Error: {main_file} not found")
    exit(1)

# Read current content
with open(main_file, 'r') as f:
    content = f.read()

# Find the imports section and add our proxy
if "import requests" in content:
    import_section = content.split("import requests")[0] + "import requests\n"
    remaining_content = content[len(import_section):]
    
    # Add import for our proxy
    import_section += "from api_proxy import proxy\n"
    
    # Combine and update
    updated_content = import_section + remaining_content
    
    # Replace the direct Mock API call with our proxy
    updated_content = re.sub(
        r'response = requests\.post\([^)]+json=\{"prompt": message\}[^)]*\)',
        'response_data = await proxy.generate(message)\nresponse = type("Response", (), {"status_code": 200, "json": lambda: response_data})()',
        updated_content
    )
    
    # If the above pattern fails, try a more general replacement
    if "await proxy.generate" not in updated_content:
        updated_content = re.sub(
            r'response = requests\.post\([^)]+\)',
            'response_data = await proxy.generate(message)\nresponse = type("Response", (), {"status_code": 200, "json": lambda: response_data})()',
            updated_content
        )
    
    # Fix any issues with response.status_code checks
    updated_content = updated_content.replace(
        'if response.status_code == 200:',
        'if True:  # Always use proxy response'
    )
    
    # Write back the updated file
    with open(main_file, 'w') as f:
        f.write(updated_content)
    
    print("Updated main.py to use the API proxy")
else:
    print("Could not find import requests in main.py")
EOL

# First, analyze the API
echo "Analyzing the Mock API to find the correct endpoints..."
docker cp $TEMP_DIR/analyze_api.py minimal-agent:/tmp/analyze_api.py
docker exec minimal-agent python /tmp/analyze_api.py

# Install the API proxy
echo "Installing the API compatibility layer..."
docker cp $TEMP_DIR/api_proxy.py minimal-agent:/tmp/api_proxy.py
docker cp $TEMP_DIR/install_proxy.py minimal-agent:/tmp/install_proxy.py
docker exec minimal-agent python /tmp/install_proxy.py

# Restart the minimal agent to apply changes
echo "Restarting minimal agent to apply changes..."
docker restart minimal-agent

# Clean up temporary files
rm -rf $TEMP_DIR

# Wait for the container to restart
echo "Waiting for minimal-agent to restart..."
sleep 5

# Test if the fix worked
echo ""
echo "Testing if the fix worked..."
TEST_RESULT=$(curl -s -X POST -H "Content-Type: application/json" -d '{"message":"test message"}' http://localhost:8000/api/chat)

if echo "$TEST_RESULT" | grep -q "error\|Could not generate"; then
    echo "⚠️ The fix may not have completely resolved the issue."
    echo "Response:"
    echo "$TEST_RESULT" | jq || echo "$TEST_RESULT"
    echo ""
    echo "Possible reasons:"
    echo "1. The Mock API is still initializing - it takes several minutes"
    echo "2. The Mock API structure is different from what we expected"
    echo ""
    echo "Try waiting for 5 minutes and then run: docker restart minimal-agent"
else
    echo "✅ Success! The minimal agent is now using the compatibility layer."
    echo "Response:"
    echo "$TEST_RESULT" | jq || echo "$TEST_RESULT"
fi

echo ""
echo "The compatibility layer will automatically adapt to the Mock API's structure"
echo "and will continue trying alternative endpoints if the primary one fails."
echo ""
echo "To view logs: docker logs minimal-agent"
echo "To access the web interface: http://localhost:8000"
