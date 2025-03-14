#!/usr/bin/env python3

try:
    import requests
except ImportError:
    print("Error: The 'requests' module is not installed.")
    print("Please install it using one of these commands:")
    print("  pip install requests")
    print("  pip3 install requests")
    print("\nAlternatively, you can run the analysis directly in the container with:")
    print("  docker exec -it minimal-agent python3 -c \"$(cat analyze_mock_api_docker.py)\"")
    
    # Create the docker-compatible version
    with open("analyze_mock_api_docker.py", "w") as f:
        f.write('''
import requests
import json
import sys
import time

print("MOCK API ANALYZER (CONTAINER VERSION)")
print("====================================")
print("This script analyzes the Mock API inside the container")

# Try to get the OpenAPI specification
try:
    print("\\nChecking for OpenAPI specification...")
    response = requests.get("http://crag-mock-api:8000/openapi.json")
    if response.status_code == 200:
        print("✅ OpenAPI specification found!")
        spec = response.json()
        
        # Save the specification for reference
        with open("/tmp/openapi_full.json", "w") as f:
            json.dump(spec, f, indent=2)
            
        print("\\nAnalyzing API paths...")
        print("{:<30} {:<10} {:<40}".format("PATH", "METHOD", "SUMMARY"))
        print("-" * 80)
        
        for path, methods in sorted(spec.get("paths", {}).items()):
            for method, details in methods.items():
                summary = details.get("summary", "")[:40]
                print("{:<30} {:<10} {:<40}".format(path, method.upper(), summary))
                
                # Analyze possible endpoints for prompting
                if method.lower() == "post":
                    if "requestBody" in details:
                        content = details.get("requestBody", {}).get("content", {})
                        if "application/json" in content:
                            schema = content["application/json"].get("schema", {})
                            if "properties" in schema:
                                print("   ↳ Request fields:", list(schema["properties"].keys()))
                                
                                # If it looks like something that might handle a prompt
                                prompt_fields = ["prompt", "message", "text", "query", "input"]
                                if any(field in schema["properties"] for field in prompt_fields):
                                    print("   ⚠️ THIS MIGHT BE A VALID ENDPOINT FOR PROMPTS!")
                                    
                                    # Try to test the endpoint
                                    for field in prompt_fields:
                                        if field in schema["properties"]:
                                            print(f"   Trying with field '{field}'...")
                                            test_request = {field: "Hello, testing API endpoint"}
                                            try:
                                                test_response = requests.post(
                                                    f"http://crag-mock-api:8000{path}",
                                                    json=test_request,
                                                    timeout=5
                                                )
                                                print(f"   Response: {test_response.status_code}")
                                                if test_response.status_code == 200:
                                                    print("   ✅ SUCCESS! This endpoint works!")
                                                    print(f"   Use field '{field}' with endpoint '{path}'")
                                                    # Save working endpoint info
                                                    with open("/tmp/working_endpoint.json", "w") as wf:
                                                        json.dump({
                                                            "endpoint": path,
                                                            "field": field,
                                                            "method": "post"
                                                        }, wf)
                                                    break
                                            except Exception as e:
                                                print(f"   Error testing: {e}")
    else:
        print(f"❌ OpenAPI specification not available (status code: {response.status_code})")
        
        # Try checking individual endpoints
        print("\\nTrying standard API endpoints directly...")
        endpoints = [
            "/v1/generate", "/v1/completions", "/v1/chat/completions",
            "/generate", "/chat", "/completions",
            "/api/v1/generate", "/api/v1/completions",
            "/api/generate", "/api/chat"
        ]
        
        # Try both direct API name and container name
        base_urls = ["http://localhost:8000", "http://crag-mock-api:8000"]
        
        for base_url in base_urls:
            print(f"\\nTrying with base URL: {base_url}")
            for endpoint in endpoints:
                url = f"{base_url}{endpoint}"
                try:
                    print(f"Testing {url}...")
                    response = requests.post(
                        url,
                        json={"prompt": "Hello, this is a test"},
                        timeout=2
                    )
                    print(f"  Status: {response.status_code}")
                    if response.status_code == 200:
                        print("  ✅ SUCCESS!")
                        try:
                            data = response.json()
                            print(f"  Response keys: {list(data.keys())}")
                            print(f"  First 100 chars: {str(data)[:100]}...")
                        except:
                            print("  Could not parse response as JSON")
                except Exception as e:
                    print(f"  Error: {e}")
        
except Exception as e:
    print(f"❌ Error analyzing the API: {e}")
    sys.exit(1)

print("\\n=== SUMMARY ===")
print("If you found a working endpoint, update the minimal agent with:")
print("1. Find the endpoint URL in main.py:")
print("   grep -n 'http://.*generate' /app/main.py")
print("2. Edit the file:")
print("   sed -i 's|/generate|/YOUR_ENDPOINT|g' /app/main.py")
print("3. Restart the container:")
print("   exit")
print("   docker restart minimal-agent")
''')
    
    print("\nCreated analyze_mock_api_docker.py that you can run in the container")
    print("Run it with: docker exec -it minimal-agent python3 analyze_mock_api_docker.py")
    exit(1)

import json
import sys
import time

print("MOCK API ANALYZER")
print("=================")
print("This script will analyze the Mock API to find working endpoints")

# Try to get the OpenAPI specification
try:
    print("Checking for OpenAPI specification...")
    response = requests.get("http://localhost:8080/openapi.json")
    if response.status_code == 200:
        print("✅ OpenAPI specification found!")
        spec = response.json()
        
        print("\nAvailable API endpoints:")
        for path, methods in spec.get("paths", {}).items():
            for method in methods:
                print(f"- {method.upper()} {path}")
                if "summary" in methods[method]:
                    print(f"  Summary: {methods[method]['summary']}")
        
        # Save the specification for reference
        with open("openapi.json", "w") as f:
            json.dump(spec, f, indent=2)
        print("\nSaved OpenAPI specification to openapi.json")
    else:
        print(f"❌ OpenAPI specification not available (status code: {response.status_code})")
except Exception as e:
    print(f"❌ Error accessing OpenAPI specification: {e}")

print("\nTesting common API endpoints...")
endpoints = [
    "/", "/generate", "/completions", "/v1/completions", "/v1/chat/completions",
    "/api/generate", "/api/completions", "/chat", "/api/chat", "/query"
]

for endpoint in endpoints:
    try:
        print(f"\nTesting {endpoint}...")
        
        # Test GET request
        try:
            get_response = requests.get(f"http://localhost:8080{endpoint}", timeout=2)
            print(f"GET: {get_response.status_code}")
        except Exception as e:
            print(f"GET error: {e}")
        
        # Test POST request with standard payload
        try:
            post_response = requests.post(
                f"http://localhost:8080{endpoint}",
                json={"prompt": "What can you do?"},
                timeout=2
            )
            print(f"POST with prompt: {post_response.status_code}")
            
            if post_response.status_code == 200:
                print("✅ Successful response!")
                try:
                    data = post_response.json()
                    print(f"Response keys: {list(data.keys())}")
                    if "response" in data:
                        print(f"Response excerpt: {data['response'][:100]}...")
                    print("\nFull raw response:")
                    print(json.dumps(data, indent=2)[:500] + "..." if len(json.dumps(data, indent=2)) > 500 else json.dumps(data, indent=2))
                except Exception as e:
                    print(f"Error parsing response: {e}")
                    print(f"Raw response: {post_response.text[:200]}...")
        except Exception as e:
            print(f"POST error: {e}")
        
        # Try OpenAI-style payload
        try:
            openai_response = requests.post(
                f"http://localhost:8080{endpoint}",
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [{"role": "user", "content": "What can you do?"}]
                },
                timeout=2
            )
            print(f"POST with OpenAI format: {openai_response.status_code}")
            
            if openai_response.status_code == 200:
                print("✅ Successful response with OpenAI format!")
                try:
                    data = openai_response.json()
                    print(f"Response keys: {list(data.keys())}")
                except Exception as e:
                    print(f"Error parsing response: {e}")
        except Exception as e:
            print(f"OpenAI-style POST error: {e}")
            
    except Exception as e:
        print(f"Error testing {endpoint}: {e}")

# Print final instructions
print("\nIf you identified a working endpoint, update the minimal agent with:")
print("""
# In minimal agent container:
sed -i 's|http://host.docker.internal:8080/generate|http://host.docker.internal:8080/WORKING_ENDPOINT|g' /app/main.py
# Then restart:
docker restart minimal-agent
""".replace("WORKING_ENDPOINT", "<the working endpoint>"))
