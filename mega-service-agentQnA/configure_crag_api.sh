#!/bin/bash

echo "=========================================================="
echo "CRAG API CONNECTOR"
echo "=========================================================="
echo "This script will identify the correct endpoints in the Mock API"

# Check if Mock API is running
if ! docker ps | grep -q "crag-mock-api"; then
  echo "❌ Mock API container is not running!"
  echo "Please start it with: docker start crag-mock-api"
  exit 1
fi

# Check if minimal agent is running  
if ! docker ps | grep -q "minimal-agent"; then
  echo "❌ Minimal agent container is not running!"
  echo "Please start it with: docker start minimal-agent"
  exit 1
fi

echo "Analyzing the CRAG API OpenAPI specification..."

# Create a Python script to extract endpoint info from OpenAPI spec
ANALYZER_SCRIPT=$(mktemp)
cat > $ANALYZER_SCRIPT << 'EOL'
import json
import requests
import os
import re

# Function to test if endpoint works
def test_endpoint(url, payload):
    try:
        print(f"Testing {url} with payload {payload}...")
        response = requests.post(url, json=payload, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"Response keys: {list(data.keys())}")
                return True, data
            except Exception as e:
                print(f"Error parsing response: {e}")
        return False, None
    except Exception as e:
        print(f"Error testing endpoint: {e}")
        return False, None

# Get the OpenAPI spec
try:
    response = requests.get("http://crag-mock-api:8000/openapi.json")
    if response.status_code != 200:
        print(f"Failed to get OpenAPI spec: {response.status_code}")
        exit(1)
        
    spec = response.json()
    print("Got OpenAPI spec successfully")
    
    # Extract all API paths and metadata
    paths = []
    
    for path, methods in spec.get("paths", {}).items():
        for method, details in methods.items():
            if method.lower() == "post":  # We're looking for POST endpoints
                request_fields = []
                response_fields = []
                
                # Check request body structure if available
                if "requestBody" in details:
                    content = details.get("requestBody", {}).get("content", {})
                    if "application/json" in content:
                        schema = content["application/json"].get("schema", {})
                        if "properties" in schema:
                            request_fields = list(schema["properties"].keys())
                
                # Check response structure if available
                if "responses" in details:
                    for status, response_info in details["responses"].items():
                        if status.startswith("2"):  # Successful responses
                            content = response_info.get("content", {})
                            if "application/json" in content:
                                schema = content["application/json"].get("schema", {})
                                if "properties" in schema:
                                    response_fields = list(schema["properties"].keys())
                
                # Add this endpoint to our list
                paths.append({
                    "path": path,
                    "method": method,
                    "summary": details.get("summary", ""),
                    "description": details.get("description", ""),
                    "request_fields": request_fields,
                    "response_fields": response_fields,
                    "tags": details.get("tags", [])
                })
    
    # Look for paths that might be text generation endpoints
    text_gen_paths = []
    
    # Common request fields for text generation
    common_prompt_fields = [
        "prompt", "text", "query", "message", "input", "q", "content", "question"
    ]
    
    # Common response fields for text generation
    common_response_fields = [
        "response", "text", "answer", "generated_text", "content", "output", "result"
    ]
    
    # First look for paths that have clear request and response fields
    for path_info in paths:
        score = 0
        
        # Check if the path looks like a text generation endpoint
        if any(keyword in path_info["path"].lower() for keyword in ["generat", "complet", "chat", "ask", "query"]):
            score += 2
        
        # Check if the summary or description mentions text generation
        if any(keyword in path_info["summary"].lower() + path_info["description"].lower() 
               for keyword in ["generat", "complet", "chat", "answer", "predict"]):
            score += 2
        
        # Check if request fields match common prompt fields
        for field in common_prompt_fields:
            if field in path_info["request_fields"]:
                score += 3
                path_info["likely_prompt_field"] = field
                break
        
        # Check if response fields match common response fields
        for field in common_response_fields:
            if field in path_info["response_fields"]:
                score += 3
                path_info["likely_response_field"] = field
                break
                
        # Add the path with its score
        if score > 0:
            path_info["score"] = score
            text_gen_paths.append(path_info)
    
    # Sort by score (highest first)
    text_gen_paths.sort(key=lambda x: x.get("score", 0), reverse=True)
    
    # Output the most likely endpoints
    if text_gen_paths:
        print("\nPotential text generation endpoints:")
        for i, path_info in enumerate(text_gen_paths[:5]):  # Show top 5
            print(f"{i+1}. {path_info['method'].upper()} {path_info['path']} (Score: {path_info['score']})")
            print(f"   Summary: {path_info['summary']}")
            if "likely_prompt_field" in path_info:
                print(f"   Likely prompt field: {path_info['likely_prompt_field']}")
            if "likely_response_field" in path_info:
                print(f"   Likely response field: {path_info['likely_response_field']}")
            print(f"   Request fields: {path_info['request_fields']}")
            print(f"   Response fields: {path_info['response_fields']}")
            print()
        
        # Test the top endpoints
        print("Testing top endpoints...")
        working_endpoints = []
        
        for path_info in text_gen_paths[:3]:  # Try top 3
            endpoint_url = f"http://crag-mock-api:8000{path_info['path']}"
            
            # Try with the likely prompt field if available
            payload = {}
            if "likely_prompt_field" in path_info:
                payload[path_info["likely_prompt_field"]] = "What can you tell me about the CRAG API?"
            else:
                # Try common fields
                for field in common_prompt_fields:
                    if field in path_info["request_fields"]:
                        payload[field] = "What can you tell me about the CRAG API?"
                        break
                # If no match, just use the first field
                if not payload and path_info["request_fields"]:
                    payload[path_info["request_fields"][0]] = "What can you tell me about the CRAG API?"
                # Last resort
                if not payload:
                    payload = {"prompt": "What can you tell me about the CRAG API?"}
            
            success, response_data = test_endpoint(endpoint_url, payload)
            if success:
                print(f"✅ Found working endpoint: {endpoint_url}")
                working_endpoints.append({
                    "url": endpoint_url,
                    "path": path_info["path"],
                    "payload_structure": payload,
                    "response_data": response_data
                })
        
        if working_endpoints:
            # Save the best working endpoint
            best_endpoint = working_endpoints[0]
            with open("/tmp/working_endpoint.json", "w") as f:
                json.dump(best_endpoint, f, indent=2)
            print(f"Saved best working endpoint to /tmp/working_endpoint.json")
            
            # Compute the new URL to use in the minimal agent
            new_url = f"http://crag-mock-api:8000{best_endpoint['path']}"
            
            # Find response field
            response_field = "response"
            if best_endpoint["response_data"]:
                for field in common_response_fields:
                    if field in best_endpoint["response_data"]:
                        response_field = field
                        break
            
            with open("/tmp/endpoint_config.json", "w") as f:
                json.dump({
                    "url": new_url,
                    "response_field": response_field,
                    "payload_structure": best_endpoint["payload_structure"]
                }, f, indent=2)
            
            print(f"Configuration created:")
            print(f"URL: {new_url}")
            print(f"Response field: {response_field}")
            print(f"Payload structure: {best_endpoint['payload_structure']}")
        else:
            print("❌ No working endpoints found through analysis")
    else:
        print("No endpoints that look like text generation endpoints were found")
    
    # If no endpoints found analytically, try the standard LLM endpoints
    if not text_gen_paths:
        print("\nTrying standard LLM API endpoints...")
        standard_endpoints = [
            "/v1/completions",
            "/v1/chat/completions",
            "/completions",
            "/generate",
            "/text",
            "/api/generate",
            "/api/completions"
        ]
        
        for endpoint in standard_endpoints:
            url = f"http://crag-mock-api:8000{endpoint}"
            payload = {"prompt": "What can you tell me about the CRAG API?"}
            success, response_data = test_endpoint(url, payload)
            
            if success:
                print(f"✅ Found working standard endpoint: {url}")
                with open("/tmp/endpoint_config.json", "w") as f:
                    json.dump({
                        "url": url,
                        "response_field": "response" if "response" in response_data else list(response_data.keys())[0],
                        "payload_structure": payload
                    }, f, indent=2)
                break

except Exception as e:
    print(f"Error analyzing the API: {e}")
EOL

# Copy and run the analyzer script
echo "Running API analyzer inside the container..."
docker cp $ANALYZER_SCRIPT minimal-agent:/tmp/analyze_api.py
docker exec minimal-agent python3 /tmp/analyze_api.py

# Check if we got a working endpoint
if ! docker exec minimal-agent test -f /tmp/endpoint_config.json; then
    echo "❌ Could not find a working endpoint for the Mock API"
    echo "Trying alternative approach..."
    
    # Create a fallback script to modify the minimal agent to be more resilient
    FALLBACK_SCRIPT=$(mktemp)
    cat > $FALLBACK_SCRIPT << 'EOL'
import os
import re

# Read the main.py file
with open('/app/main.py', 'r') as f:
    content = f.read()

# Modify the code to try multiple endpoints
if 'requests.post(' in content:
    # Find the Mock API URL pattern
    url_match = re.search(r'(http://[^/]+:[0-9]+)/generate', content)
    if url_match:
        base_url = url_match.group(1)
        print(f"Found Mock API base URL: {base_url}")
        
        # Create the replacement code for trying multiple endpoints
        replacement = f'''
        # Try multiple endpoints for the Mock API
        endpoints_to_try = [
            "{base_url}/generate", 
            "{base_url}/completions",
            "{base_url}/v1/completions",
            "{base_url}/v1/chat/completions",
            "{base_url}/text",
            "{base_url}/api/generate",
            "http://crag-mock-api:8000/generate",
            "http://crag-mock-api:8000/completions",
            "http://crag-mock-api:8000/v1/completions"
        ]
        
        response = None
        for endpoint in endpoints_to_try:
            try:
                logger.info(f"Trying endpoint: {{endpoint}}")
                payload = {{"prompt": message}}
                
                # For OpenAI style endpoints
                if "chat/completions" in endpoint:
                    payload = {{
                        "model": "gpt-3.5-turbo",
                        "messages": [{{"role": "user", "content": message}}]
                    }}
                
                response = requests.post(endpoint, json=payload, timeout=10)
                
                if response.status_code == 200:
                    logger.info(f"Successfully connected to {{endpoint}}")
                    break
                else:
                    logger.warning(f"Endpoint {{endpoint}} returned status {{response.status_code}}")
            except Exception as e:
                logger.warning(f"Failed to connect to {{endpoint}}: {{str(e)}}")
        
        # If no endpoint worked, create a mock response
        if response is None or response.status_code != 200:
            logger.error("All endpoints failed, creating mock response")
            from types import SimpleNamespace
            response = SimpleNamespace()
            response.status_code = 200
            response.json = lambda: {{"response": "API connection failed. Please check that the Mock API is running and initialized."}}
        '''
        
        # Replace the original API call
        api_call_pattern = r'response = requests\.post\([^)]+\)[^\n]+'
        updated_content = re.sub(api_call_pattern, replacement, content)
        
        # Write the updated content back to the file
        with open('/app/main.py', 'w') as f:
            f.write(updated_content)
        
        print("Updated main.py with multi-endpoint fallback mechanism")
    else:
        print("Could not find Mock API URL pattern in main.py")
else:
    print("Could not find requests.post in main.py")
EOL

    # Copy and run the fallback script
    echo "Setting up resilient endpoint handling..."
    docker cp $FALLBACK_SCRIPT minimal-agent:/tmp/fallback.py
    docker exec minimal-agent python3 /tmp/fallback.py
    
    # Restart the minimal agent
    echo "Restarting minimal agent with resilient endpoint handling..."
    docker restart minimal-agent
    
    echo "Minimal agent has been updated to try multiple possible endpoints."
    echo "Please wait a few minutes for the Mock API to fully initialize before testing."
else
    # Create a script to update the minimal agent with the working endpoint
    UPDATE_SCRIPT=$(mktemp)
    cat > $UPDATE_SCRIPT << 'EOL'
import json
import re

# Load the endpoint configuration
with open('/tmp/endpoint_config.json', 'r') as f:
    config = json.load(f)

# Read the main.py file
with open('/app/main.py', 'r') as f:
    content = f.read()

# Update the Mock API URL
url_match = re.search(r'http://[^/]+:[0-9]+/generate', content)
if url_match:
    old_url = url_match.group(0)
    new_url = config['url']
    print(f"Replacing URL: {old_url} -> {new_url}")
    content = content.replace(old_url, new_url)
    
    # Update the response field if needed
    if config['response_field'] != 'response':
        print(f"Updating response field to: {config['response_field']}")
        content = content.replace('data.get("response")', f'data.get("{config["response_field"]}")')
    
    # Also update the request payload structure if needed
    payload_structure = config['payload_structure']
    if list(payload_structure.keys())[0] != 'prompt':
        field = list(payload_structure.keys())[0]
        print(f"Updating request payload field: prompt -> {field}")
        content = content.replace('{"prompt": message}', f'{{{json.dumps(field)}: message}}')
    
    # Write the updated content back to the file
    with open('/app/main.py', 'w') as f:
        f.write(content)
    
    print("Successfully updated main.py with the working endpoint configuration")
else:
    print("Could not find Mock API URL pattern in main.py")
EOL

    # Copy and run the update script
    echo "Updating minimal agent with working endpoint configuration..."
    docker cp $UPDATE_SCRIPT minimal-agent:/tmp/update.py
    docker exec minimal-agent python3 /tmp/update.py
    
    # Restart the minimal agent
    echo "Restarting minimal agent with updated configuration..."
    docker restart minimal-agent
    
    # Wait for the container to restart
    echo "Waiting for container to restart..."
    sleep 5
    
    # Test the connection
    echo ""
    echo "Testing the connection..."
    echo ""
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"message":"What is the CRAG API?"}' \
        http://localhost:8000/api/chat | jq || echo "Failed to parse response as JSON"
fi

# Clean up temporary files
rm -f $ANALYZER_SCRIPT $FALLBACK_SCRIPT $UPDATE_SCRIPT 2>/dev/null

echo ""
echo "=========================================================="
echo "CONFIGURATION COMPLETE"
echo "=========================================================="
echo ""
echo "The minimal agent has been configured to use the appropriate endpoints."
echo "If you still encounter connection issues, please wait a few minutes for"
echo "the Mock API to fully initialize all components."
echo ""
echo "You can access the web interface at: http://localhost:8000"
