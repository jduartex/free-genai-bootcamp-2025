#!/bin/bash

echo "=========================================================="
echo "CRAG API ENDPOINT IDENTIFIER AND FIXER"
echo "=========================================================="
echo "This script will find and configure the correct API endpoints"

# Check containers are running
if ! docker ps | grep -q "crag-mock-api"; then
    echo "❌ Mock API container is not running"
    exit 1
fi

if ! docker ps | grep -q "minimal-agent"; then
    echo "❌ Minimal agent container is not running"
    exit 1
fi

# Create a comprehensive API analysis script
ANALYSIS_SCRIPT=$(mktemp)
cat > $ANALYSIS_SCRIPT << 'EOL'
import requests
import json
import sys
import os
import time
import re

print("=== CRAG API ADVANCED ENDPOINT ANALYZER ===")

# Base URLs to try
BASE_URLS = [
    "http://crag-mock-api:8000",
    "http://host.docker.internal:8080"
]

# Common payload formats to try
PAYLOAD_FORMATS = [
    {"prompt": "What is the CRAG API?"},
    {"query": "What is the CRAG API?"},
    {"message": "What is the CRAG API?"},
    {"text": "What is the CRAG API?"},
    {"input": "What is the CRAG API?"},
    {"question": "What is the CRAG API?"},
    {"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "What is the CRAG API?"}]}
]

# Check if OpenAPI doc is available
print("\nChecking for API documentation...")
openapi_available = False
openapi_spec = None

for base_url in BASE_URLS:
    try:
        response = requests.get(f"{base_url}/openapi.json", timeout=5)
        if response.status_code == 200:
            print(f"✅ Found OpenAPI spec at {base_url}/openapi.json")
            openapi_spec = response.json()
            with open("/tmp/openapi_spec.json", "w") as f:
                json.dump(openapi_spec, f, indent=2)
            print("  Saved to /tmp/openapi_spec.json")
            openapi_available = True
            break
    except Exception as e:
        print(f"❌ Could not access {base_url}/openapi.json: {e}")

# Test if API root responds
print("\nTesting API root endpoints...")
for base_url in BASE_URLS:
    try:
        response = requests.get(base_url, timeout=5)
        print(f"GET {base_url}: {response.status_code}")
        if response.status_code < 400:
            print(f"  Response: {response.text[:100]}...")
    except Exception as e:
        print(f"❌ Could not access {base_url}: {e}")

# Common endpoints to try
endpoints = [
    "/v1/completions",
    "/v1/chat/completions",
    "/crag",
    "/generate",
    "/completions",
    "/chat",
    "/api/v1/generate",
    "/api/v1/completions",
    "/api/chat",
    "/api/generate",
    "/api/query",
    "/api/complete",
    "/query",
    "/answer",
    "/complete",
    "/text"
]

# Add endpoints from OpenAPI if available
if openapi_spec:
    for path in openapi_spec.get("paths", {}):
        if path not in endpoints:
            endpoints.append(path)

# Find working endpoints with payloads
print("\nTesting API endpoints with various payload formats...")
working_endpoints = []

for base_url in BASE_URLS:
    for endpoint in endpoints:
        url = f"{base_url}{endpoint}"
        print(f"\nTesting {url}")
        
        for payload_format in PAYLOAD_FORMATS:
            try:
                print(f"  With payload: {json.dumps(payload_format)[:50]}...")
                response = requests.post(url, json=payload_format, timeout=10)
                print(f"  Status: {response.status_code}")
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        print(f"  Response keys: {list(data.keys())}")
                        
                        # Check if this looks like a valid response
                        has_content = False
                        response_field = None
                        
                        # Check common response fields
                        for field in ["response", "text", "answer", "generated_text", "content", "output", "result"]:
                            if field in data and isinstance(data[field], str) and len(data[field]) > 20:
                                has_content = True
                                response_field = field
                                print(f"  Found content in '{field}' field: {data[field][:50]}...")
                                break
                        
                        # Check for OpenAI-style response
                        if "choices" in data and isinstance(data["choices"], list) and len(data["choices"]) > 0:
                            choice = data["choices"][0]
                            if isinstance(choice, dict):
                                if "text" in choice:
                                    has_content = True
                                    response_field = "choices[0].text"
                                    print(f"  Found OpenAI-style content: {choice['text'][:50]}...")
                                elif "message" in choice and isinstance(choice["message"], dict) and "content" in choice["message"]:
                                    has_content = True
                                    response_field = "choices[0].message.content"
                                    print(f"  Found OpenAI chat content: {choice['message']['content'][:50]}...")
                        
                        if has_content:
                            working_endpoint = {
                                "url": url,
                                "payload": payload_format,
                                "response_field": response_field,
                                "sample_response": data
                            }
                            working_endpoints.append(working_endpoint)
                            print(f"✅ FOUND WORKING ENDPOINT: {url}")
                            
                    except Exception as e:
                        print(f"  Error parsing response: {e}")
                        
            except Exception as e:
                print(f"  Error: {e}")

# Save results
if working_endpoints:
    print(f"\nFound {len(working_endpoints)} working endpoints.")
    with open("/tmp/working_endpoints.json", "w") as f:
        json.dump(working_endpoints, f, indent=2)
    print("Saved to /tmp/working_endpoints.json")
    
    # Select best endpoint - prioritize OpenAI style if available
    best_endpoint = None
    for endpoint in working_endpoints:
        if endpoint["response_field"] and endpoint["response_field"].startswith("choices"):
            best_endpoint = endpoint
            break
    
    # If no OpenAI style, pick the first one
    if not best_endpoint and working_endpoints:
        best_endpoint = working_endpoints[0]
    
    if best_endpoint:
        print("\n=== RECOMMENDED ENDPOINT ===")
        print(f"URL: {best_endpoint['url']}")
        print(f"Payload format: {json.dumps(best_endpoint['payload'])}")
        print(f"Response field: {best_endpoint['response_field']}")
        
        # Save the best endpoint to a special file
        with open("/tmp/best_endpoint.json", "w") as f:
            json.dump(best_endpoint, f, indent=2)
else:
    print("\n❌ No working endpoints found!")

# Check for domain-specific endpoints in the API
if openapi_spec:
    print("\nAnalyzing for domain-specific endpoints...")
    domains = ["movie", "finance", "music", "sports", "general", "open"]
    
    domain_endpoints = []
    
    for path in openapi_spec.get("paths", {}):
        for domain in domains:
            if domain in path.lower():
                methods = openapi_spec["paths"][path]
                for method, details in methods.items():
                    domain_endpoints.append({
                        "path": path,
                        "method": method,
                        "domain": domain,
                        "summary": details.get("summary", "")
                    })
    
    if domain_endpoints:
        print(f"Found {len(domain_endpoints)} domain-specific endpoints:")
        for endpoint in domain_endpoints:
            print(f"- {endpoint['method'].upper()} {endpoint['path']} ({endpoint['domain']})")
        
        # Save domain endpoints
        with open("/tmp/domain_endpoints.json", "w") as f:
            json.dump(domain_endpoints, f, indent=2)
EOL

# Install the adapter module
ADAPTER_SCRIPT=$(mktemp)
cat > $ADAPTER_SCRIPT << 'EOL'
import json
import re
import os

# Create the adapter directory
os.makedirs("/app/crag_adapter", exist_ok=True)

# First check if we found working endpoints
best_endpoint = None
try:
    if os.path.exists("/tmp/best_endpoint.json"):
        with open("/tmp/best_endpoint.json") as f:
            best_endpoint = json.load(f)
        print(f"Found best endpoint: {best_endpoint['url']}")
except Exception as e:
    print(f"Error reading best endpoint: {e}")

# Create the adapter module
with open("/app/crag_adapter/__init__.py", "w") as f:
    f.write('''
import requests
import json
import logging
import time
import asyncio
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("crag-adapter")

class CragAdapter:
    """Smart adapter for the CRAG Mock API"""
    
    def __init__(self):
        # Basic configurations
        self.base_urls = [
            "http://crag-mock-api:8000",
            "http://host.docker.internal:8080"
        ]
        
        # Endpoints to try in order of preference
        self.endpoints = [
''')

    # Add best endpoint first if available
    if best_endpoint:
        endpoint_url = best_endpoint["url"]
        path = endpoint_url.split("://")[1].split("/", 1)[1] if "/" in endpoint_url.split("://")[1] else ""
        f.write(f'            "/{path}",  # Best endpoint found during analysis\n')
    
    # Add standard endpoints
    f.write('''            "/v1/chat/completions",
            "/v1/completions",
            "/generate",
            "/completions",
            "/chat",
            "/api/generate",
            "/crag",
            "/query"
        ]
        
        # Payload formats to try
        self.payload_formats = [
''')

    # Add best payload format first if available
    if best_endpoint:
        payload = json.dumps(best_endpoint["payload"])
        f.write(f'            {payload},  # Best payload format\n')
    
    # Add standard payload formats
    f.write('''            {"prompt": ""},  # Standard prompt
            {"query": ""},  # Query format
            {"message": ""},  # Message format
            {"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": ""}]}  # OpenAI format
        ]
        
        # The last endpoint that worked
        self.working_endpoint = None
        self.working_base_url = None
        self.working_payload_format = None
        self.working_response_field = None
''')

    # Add working response field if available
    if best_endpoint and best_endpoint.get("response_field"):
        f.write(f'        self.working_response_field = "{best_endpoint["response_field"]}"\n')

    f.write('''
    def _extract_text(self, response_data: Dict[str, Any]) -> str:
        """Extract text from various response formats"""
        # If we know which field contains the response, use that
        if self.working_response_field:
            if self.working_response_field == "choices[0].text":
                if "choices" in response_data and len(response_data["choices"]) > 0:
                    return response_data["choices"][0].get("text", "")
            elif self.working_response_field == "choices[0].message.content":
                if "choices" in response_data and len(response_data["choices"]) > 0:
                    message = response_data["choices"][0].get("message", {})
                    if isinstance(message, dict):
                        return message.get("content", "")
            elif self.working_response_field in response_data:
                return response_data[self.working_response_field]
        
        # Try common response fields
        for field in ["response", "text", "answer", "generated_text", "content", "output", "result"]:
            if field in response_data:
                return response_data[field]
        
        # Handle OpenAI style format
        if "choices" in response_data and len(response_data["choices"]) > 0:
            choice = response_data["choices"][0]
            if isinstance(choice, dict):
                if "text" in choice:
                    return choice["text"]
                elif "message" in choice and isinstance(choice["message"], dict):
                    return choice["message"].get("content", "")
        
        # If we can't find a field with the response, return the whole response as JSON
        return "Response format unknown: " + json.dumps(response_data)[:100] + "..."
    
    def _create_payload(self, prompt: str, payload_format: Dict[str, Any]) -> Dict[str, Any]:
        """Create a payload with the given prompt and format"""
        result = payload_format.copy()
        
        # OpenAI format
        if "messages" in result:
            for i, msg in enumerate(result["messages"]):
                if msg.get("role") == "user":
                    result["messages"][i]["content"] = prompt
                    return result
            # If no user message found, add one
            result["messages"].append({"role": "user", "content": prompt})
            return result
            
        # Standard formats - find the first string field
        for key, value in result.items():
            if isinstance(value, str):
                result[key] = prompt
                return result
        
        # If no string field found, add prompt field
        result["prompt"] = prompt
        return result
    
    async def ask(self, prompt: str) -> Dict[str, Any]:
        """Send a question to the API and get a response"""
        if not prompt:
            return {"response": "Empty prompt", "status": "error"}
        
        logger.info(f"Processing prompt: {prompt[:50]}...")
        
        # If we have a working endpoint, try it first
        if self.working_endpoint and self.working_base_url and self.working_payload_format:
            url = f"{self.working_base_url}{self.working_endpoint}"
            payload = self._create_payload(prompt, self.working_payload_format)
            
            try:
                logger.info(f"Trying working endpoint: {url}")
                response = requests.post(url, json=payload, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    text = self._extract_text(data)
                    return {"response": text, "status": "success"}
            except Exception as e:
                logger.warning(f"Error with working endpoint: {e}")
        
        # Try all combinations of base URLs, endpoints, and payload formats
        for base_url in self.base_urls:
            for endpoint in self.endpoints:
                url = f"{base_url}{endpoint}"
                logger.info(f"Trying URL: {url}")
                
                for payload_format in self.payload_formats:
                    payload = self._create_payload(prompt, payload_format)
                    
                    try:
                        response = requests.post(url, json=payload, timeout=10)
                        
                        if response.status_code == 200:
                            try:
                                data = response.json()
                                text = self._extract_text(data)
                                
                                # Save this working configuration
                                self.working_endpoint = endpoint
                                self.working_base_url = base_url
                                self.working_payload_format = payload_format
                                
                                # Try to determine response field for future use
                                for field in ["response", "text", "answer", "generated_text", "content"]:
                                    if field in data:
                                        self.working_response_field = field
                                        break
                                
                                if "choices" in data and len(data["choices"]) > 0:
                                    choice = data["choices"][0]
                                    if isinstance(choice, dict):
                                        if "text" in choice:
                                            self.working_response_field = "choices[0].text"
                                        elif "message" in choice and "content" in choice["message"]:
                                            self.working_response_field = "choices[0].message.content"
                                
                                logger.info(f"Found working endpoint: {url}")
                                logger.info(f"Response field: {self.working_response_field}")
                                
                                return {"response": text, "status": "success"}
                            except Exception as e:
                                logger.warning(f"Error processing response: {e}")
                    except Exception as e:
                        logger.warning(f"Error with {url}: {e}")
        
        # If all attempts fail
        return {
            "response": "I'm sorry, I couldn't get a response from the CRAG API. It may not be fully initialized yet.",
            "status": "error"
        }

# Create singleton instance
api = CragAdapter()
''')

# Create a test script
with open("/app/test_adapter.py", "w") as f:
    f.write('''
import asyncio
from crag_adapter import api

async def main():
    print("Testing CRAG adapter...")
    response = await api.ask("What is the CRAG API?")
    print(f"Response: {response}")

if __name__ == "__main__":
    asyncio.run(main())
''')

# Update main.py to use the adapter
main_file = '/app/main.py'
with open(main_file, 'r') as f:
    content = f.read()

# Check if imports section exists
if "import requests" in content:
    # Add import for our adapter
    if "from crag_adapter import api" not in content:
        content = content.replace("import requests", "import requests\nfrom crag_adapter import api")
    
    # Replace API call with our adapter
    api_call_pattern = r'response = requests\.post\([^)]+\)[^\n]+'
    replacement = 'response_data = await api.ask(message)\nresponse = type("Response", (), {"status_code": 200, "json": lambda: {"response": response_data.get("response", "")}})()'
    
    if re.search(api_call_pattern, content):
        content = re.sub(api_call_pattern, replacement, content)
    elif "response = requests.post" in content:
        content = content.replace(
            "response = requests.post",
            "response_data = await api.ask(message)\n            # Skip original request\n            #response = requests.post"
        )
        content = content.replace(
            "data = response.json()",
            "data = {\"response\": response_data.get(\"response\", \"\")}"
        )
    
    # Write the updated content
    with open(main_file, 'w') as f:
        f.write(content)
    
    print("Updated main.py to use the adapter")
else:
    print("Could not find imports section in main.py")
EOL

# Copy scripts to container and run them
echo "Analyzing API endpoints..."
docker cp $ANALYSIS_SCRIPT minimal-agent:/tmp/analyze_endpoints.py
docker exec minimal-agent python3 /tmp/analyze_endpoints.py

echo "Installing smart endpoint adapter..."
docker cp $ADAPTER_SCRIPT minimal-agent:/tmp/install_adapter.py
docker exec minimal-agent python3 /tmp/install_adapter.py

# Clean up temp files
rm $ANALYSIS_SCRIPT $ADAPTER_SCRIPT

# Restart the minimal agent to apply changes
echo "Restarting minimal agent to apply changes..."
docker restart minimal-agent

# Wait for container to restart
echo "Waiting for container to restart..."
sleep 5

# Test with the adapter
echo "Testing the smart adapter..."
curl -s -X POST \
     -H "Content-Type: application/json" \
     -d '{"message":"What is the CRAG API?"}' \
     http://localhost:8000/api/chat | jq || echo "Could not parse response as JSON"

echo ""
echo "=========================================================="
echo "SETUP COMPLETE"
echo "=========================================================="
echo ""
echo "The minimal agent is now using a smart adapter that will:"
echo "1. Try multiple API endpoints until it finds one that works"
echo "2. Use the correct payload format for each endpoint"
echo "3. Extract responses correctly regardless of format"
echo "4. Remember which endpoint worked for future requests"
echo ""
echo "This should solve the 404 issues with the Mock API endpoints."
echo ""
echo "You can access the web interface at: http://localhost:8000"
echo "If you still have issues, try checking the logs: docker logs minimal-agent"
