#!/bin/bash

echo "=========================================================="
echo "CRAG API COMPLETE SETUP"
echo "=========================================================="
echo "This script will start all containers and configure the system"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

# Create a dedicated network if it doesn't exist
NETWORK_NAME="agentqna-network"
echo "Creating network $NETWORK_NAME if it doesn't exist..."
docker network create $NETWORK_NAME 2>/dev/null || true

# Step 1: Start or create the Mock API container
echo -e "\n=== STARTING MOCK API ==="
if docker ps | grep -q "crag-mock-api"; then
    echo "✅ Mock API container is already running"
else
    # Check if it exists but is stopped
    if docker ps -a | grep -q "crag-mock-api"; then
        echo "Starting existing Mock API container..."
        docker start crag-mock-api
    else
        echo "Creating new Mock API container..."
        docker pull docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0
        docker run -d \
            --name crag-mock-api \
            --network $NETWORK_NAME \
            -p 8080:8000 \
            docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0
    fi
    
    # Check if it's now running
    if ! docker ps | grep -q "crag-mock-api"; then
        echo "❌ Failed to start Mock API container"
        exit 1
    else
        echo "✅ Mock API container started successfully"
    fi
fi

# Connect to network if needed
if ! docker network inspect $NETWORK_NAME | grep -q "crag-mock-api"; then
    echo "Connecting crag-mock-api to $NETWORK_NAME network..."
    docker network connect $NETWORK_NAME crag-mock-api
fi

# Step 2: Create the minimal agent container (but don't start it yet)
echo -e "\n=== CREATING MINIMAL AGENT ==="
if docker ps | grep -q "minimal-agent"; then
    echo "⚠️ Stopping existing minimal agent for reconfiguration..."
    docker stop minimal-agent
    docker rm -f minimal-agent
elif docker ps -a | grep -q "minimal-agent"; then
    echo "⚠️ Removing existing minimal agent container..."
    docker rm -f minimal-agent
fi

# Create a temporary directory for our files
TEMP_DIR=$(mktemp -d)
echo "Using temporary directory: $TEMP_DIR"

# Create a minimal FastAPI app with FIXED INDENTATION from the beginning
cat > $TEMP_DIR/main.py << 'EOL'
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
import uvicorn
import logging
import requests
import json

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s:%(name)s:%(message)s')
logger = logging.getLogger("minimal-agent")

# Create FastAPI app
app = FastAPI()

@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Minimal Agent</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .chat-container { margin-top: 20px; }
            #messages { height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; }
            .message { padding: 8px; margin-bottom: 10px; border-radius: 5px; }
            .user-message { background-color: #e3f2fd; text-align: right; }
            .agent-message { background-color: #f5f5f5; }
            .input-container { display: flex; }
            #input { flex-grow: 1; padding: 8px; }
            button { padding: 8px 16px; background-color: #4CAF50; color: white; border: none; cursor: pointer; }
        </style>
    </head>
    <body>
        <h1>Minimal Agent</h1>
        <div class="chat-container">
            <div id="messages"></div>
            <div class="input-container">
                <input id="input" type="text" placeholder="Type your message..." />
                <button onclick="sendMessage()">Send</button>
            </div>
        </div>
        <script>
            async function sendMessage() {
                const input = document.getElementById('input');
                const message = input.value.trim();
                if (!message) return;
                
                // Display user message
                const messages = document.getElementById('messages');
                messages.innerHTML += `<div class="message user-message">${message}</div>`;
                input.value = '';
                
                // Send to backend
                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message })
                    });
                    const data = await response.json();
                    
                    // Display agent message
                    messages.innerHTML += `<div class="message agent-message">${data.response}</div>`;
                    messages.scrollTop = messages.scrollHeight;
                } catch (error) {
                    console.error('Error:', error);
                    messages.innerHTML += `<div class="message agent-message">Error: Could not get response</div>`;
                }
                
                messages.scrollTop = messages.scrollHeight;
            }
            
            // Set up event listener for Enter key
            document.addEventListener('DOMContentLoaded', () => {
                const input = document.getElementById('input');
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        sendMessage();
                    }
                });
            });
        </script>
    </body>
    </html>
    """

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/api/chat")
async def api_chat(request: Request):
    logger.info("Received POST to /api/chat")
    
    # Parse the request body
    try:
        body = await request.json()
        logger.info(f"Raw request body: {body}")
        
        # Extract the message from the request body
        message = None
        if isinstance(body, dict):
            if "message" in body:
                message = body["message"]
                logger.info(f"Found message in 'message' field: {message}...")
        
        if not message:
            return {"response": "No message found in request", "status": "error"}
        
        logger.info(f"Processing message: {message}...")
        
        # Call the Mock API - PROPERLY INDENTED FROM THE START
        logger.info("Attempting to connect to Mock API")
        try:
            # List of endpoints to try (with proper indentation)
            endpoints_to_try = [
                "http://crag-mock-api:8000/generate",
                "http://crag-mock-api:8000/v1/completions",
                "http://crag-mock-api:8000/v1/chat/completions"
            ]
            
            response = None
            for endpoint in endpoints_to_try:
                try:
                    logger.info(f"Trying endpoint: {endpoint}")
                    response = requests.post(
                        endpoint,
                        json={"prompt": message},
                        timeout=10
                    )
                    if response.status_code == 200:
                        break
                except Exception as e:
                    logger.warning(f"Failed to connect to {endpoint}: {e}")
            
            # If we found a working endpoint
            if response and response.status_code == 200:
                data = response.json()
                return {"response": data.get("response", "No response from API"), "status": "success"}
            else:
                logger.warning(f"All endpoints failed or returned non-200 status")
                return {
                    "response": "The Mock API is not responding. It might still be initializing.",
                    "status": "error"
                }
        except Exception as e:
            logger.error(f"Failed to connect to Mock API - {str(e)}")
            return {
                "response": "Could not connect to the Mock API. Please make sure it's running and try again.",
                "status": "error"
            }
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {"response": f"Error processing request: {str(e)}", "status": "error"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOL

# Create a Dockerfile
cat > $TEMP_DIR/Dockerfile << 'EOL'
FROM python:3.9-slim

WORKDIR /app

COPY main.py .

# Install dependencies
RUN pip install --no-cache-dir fastapi uvicorn requests

# Expose the port
EXPOSE 8000

# Start the application
CMD ["python", "main.py"]
EOL

# Build the container with fixed code
echo "Building minimal agent Docker image with fixed indentation..."
docker build -t minimal-agent:latest $TEMP_DIR

# Clean up temporary directory
rm -rf $TEMP_DIR

# Step 3: Create and start the minimal agent container
echo -e "\n=== STARTING MINIMAL AGENT ==="
echo "Running minimal agent container with fixed code..."
docker run -d \
    --name minimal-agent \
    --network $NETWORK_NAME \
    -p 8000:8000 \
    minimal-agent:latest

# Check if it's running
if ! docker ps | grep -q "minimal-agent"; then
    echo "❌ Failed to start minimal agent container"
    exit 1
else
    echo "✅ Minimal agent container started successfully"
fi

# Connect to network if needed
if ! docker network inspect $NETWORK_NAME | grep -q "minimal-agent"; then
    echo "Connecting minimal-agent to $NETWORK_NAME network..."
    docker network connect $NETWORK_NAME minimal-agent
fi

# Step 4: Wait for the Mock API to initialize
echo -e "\n=== WAITING FOR MOCK API INITIALIZATION ==="
echo "The Mock API needs time to initialize. Checking status..."

# Check if the API is already fully initialized
if docker logs crag-mock-api 2>&1 | grep -q "Application startup complete"; then
    echo "✅ Mock API is already fully initialized"
else
    echo "Mock API is still initializing. This may take several minutes."
    echo "Continuing with setup, but be aware the API might not respond immediately."
fi

# Step 5: Install the improved domain adapter (from fix_domain_adapter.sh)
echo -e "\n=== INSTALLING IMPROVED DOMAIN ADAPTER ==="

# Create a temporary directory for our files
DOMAIN_ADAPTER_DIR=$(mktemp -d)
echo "Using temporary directory for domain adapter: $DOMAIN_ADAPTER_DIR"

# Create the domain adapter file
echo "Creating domain adapter file..."
cat > "$DOMAIN_ADAPTER_DIR/crag_domain_adapter.py" << 'EOL'
import requests
import json
import logging
import asyncio
import re
from typing import Dict, Any, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("crag-domain-adapter")

class CragDomainAdapter:
    """Adapter for the CRAG Mock API that routes queries to domain-specific endpoints"""
    
    def __init__(self, base_url="http://crag-mock-api:8000"):
        self.base_url = base_url
        self.domains = {
            "movie": self._setup_movie_domain(),
            "finance": self._setup_finance_domain(),
            "music": self._setup_music_domain(),
            "sports": self._setup_sports_domain(),
            "open": self._setup_open_domain()
        }
        # Track successful endpoints for future use
        self.successful_endpoints = {}
        self.fallback_endpoint = "/music/grammy_get_all_awarded_artists"
    
    def _setup_movie_domain(self) -> Dict[str, str]:
        return {
            "endpoint": "/movie/get_movie_info",
            "keywords": ["movie", "film", "actor", "actress", "director", "cinema", "hollywood"]
        }
    
    def _setup_finance_domain(self) -> Dict[str, str]:
        return {
            "endpoint": "/finance/get_info",
            "keywords": ["stock", "price", "market", "company", "financial", "dividend", "ticker", "shares"]
        }
    
    def _setup_music_domain(self) -> Dict[str, str]:
        return {
            "endpoint": "/music/get_artist_all_works",
            "keywords": ["music", "song", "artist", "album", "band", "grammy", "singer"]
        }
    
    def _setup_sports_domain(self) -> Dict[str, str]:
        return {
            "endpoint": "/sports/nba/get_games_on_date",
            "keywords": ["sports", "team", "player", "game", "match", "score", "nba", "basketball", "soccer"]
        }
    
    def _setup_open_domain(self) -> Dict[str, str]:
        return {
            "endpoint": "/open/search_entity_by_name",
            "keywords": []  # Fallback domain
        }
    
    def determine_domain(self, query: str) -> str:
        """Determine the domain based on the query content"""
        query_lower = query.lower()
        
        # Check each domain for keyword matches
        domain_scores = {}
        for domain, info in self.domains.items():
            score = 0
            for keyword in info["keywords"]:
                if keyword in query_lower:
                    score += 1
            domain_scores[domain] = score
        
        # Get the domain with the highest score
        best_domain = max(domain_scores.items(), key=lambda x: x[1])
        
        # If no clear domain match, use 'open'
        if best_domain[1] == 0:
            return "open"
        
        return best_domain[0]
    
    async def ask(self, query: str) -> Dict[str, Any]:
        """Process a query and route it to the appropriate domain endpoint"""
        if not query:
            return {"response": "Empty query", "status": "error"}
        
        logger.info(f"Processing query: {query[:50]}...")
        
        # Check if Mock API is available
        try:
            response = await self._async_request("GET", f"{self.base_url}/openapi.json", timeout=2)
            if response.status_code != 200:
                return {"response": "Mock API is still initializing. Please try again in a few minutes.", "status": "error"}
        except Exception:
            return {"response": "Cannot connect to Mock API. It may still be initializing.", "status": "error"}
        
        # Try a successful endpoint first if we've used this domain before
        domain = self.determine_domain(query)
        logger.info(f"Query domain: {domain}")
        
        if domain in self.successful_endpoints:
            result = await self._try_endpoint(
                self.successful_endpoints[domain],
                query
            )
            if result and "response" in result:
                return result
        
        # Try the default endpoint for this domain
        domain_info = self.domains[domain]
        result = await self._try_endpoint(domain_info["endpoint"], query)
        if result and "response" in result:
            # Remember this successful endpoint
            self.successful_endpoints[domain] = domain_info["endpoint"]
            return result
        
        # Try other endpoints in this domain
        all_endpoints = await self._get_domain_endpoints(domain)
        for endpoint in all_endpoints:
            if endpoint != domain_info["endpoint"]:
                result = await self._try_endpoint(endpoint, query)
                if result and "response" in result:
                    # Remember this successful endpoint
                    self.successful_endpoints[domain] = endpoint
                    return result
        
        # If domain-specific endpoints fail, use fallback
        logger.info(f"Domain endpoints failed, trying fallback endpoint")
        result = await self._try_endpoint(self.fallback_endpoint, query)
        if result and "response" in result:
            return result
        
        # If all else fails, return a helpful error
        return {
            "response": f"I couldn't find information about {query} in our knowledge base. The API might still be initializing or this topic might not be covered in the available domains (movie, finance, music, sports, general knowledge).",
            "status": "error"
        }
    
    async def _get_domain_endpoints(self, domain: str) -> List[str]:
        """Get all endpoints for a specific domain"""
        # Cache these to avoid repeated calls
        if hasattr(self, '_domain_endpoints_cache'):
            if domain in self._domain_endpoints_cache:
                return self._domain_endpoints_cache[domain]
        else:
            self._domain_endpoints_cache = {}
            
        # Start with the main domain endpoint
        endpoints = [self.domains[domain]["endpoint"]]
        
        try:
            # Try to get OpenAPI spec to find all endpoints
            response = await self._async_request("GET", f"{self.base_url}/openapi.json")
            if response.status_code == 200:
                spec = response.json()
                for path in spec.get("paths", {}):
                    if f"/{domain}/" in path:
                        endpoints.append(path)
        except Exception as e:
            logger.warning(f"Error getting domain endpoints: {e}")
        
        # Cache for future use
        self._domain_endpoints_cache[domain] = endpoints
        return endpoints
    
    async def _try_endpoint(self, endpoint: str, query: str) -> Optional[Dict[str, Any]]:
        """Try a specific endpoint with the query"""
        url = f"{self.base_url}{endpoint}"
        logger.info(f"Trying endpoint: {url}")
        
        payload = {"query": query}
        try:
            response = await self._async_request("POST", url, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                # All successful responses seem to have a 'result' key
                if "result" in data:
                    # Format the result for display
                    formatted_response = self._format_result(data["result"])
                    return {
                        "response": formatted_response,
                        "status": "success",
                        "endpoint": endpoint,
                        "raw_data": data
                    }
                else:
                    logger.warning(f"Unexpected response format from {endpoint}: {data}")
            else:
                logger.warning(f"Endpoint {endpoint} returned status {response.status_code}")
        except Exception as e:
            logger.error(f"Error calling {endpoint}: {e}")
            
        return None
    
    def _format_result(self, result: Any) -> str:
        """Format the result data into a readable response"""
        if isinstance(result, str):
            return result
            
        elif isinstance(result, dict):
            # Try to create a readable response from dictionary
            parts = []
            for key, value in result.items():
                formatted_key = key.replace("_", " ").title()
                parts.append(f"{formatted_key}: {value}")
            return "\n".join(parts)
            
        elif isinstance(result, list):
            # If it's a small list, format each item
            if len(result) <= 10:
                if all(isinstance(item, dict) for item in result):
                    # Format list of objects nicely
                    formatted_items = []
                    for item in result:
                        item_parts = []
                        for key, value in item.items():
                            formatted_key = key.replace("_", " ").title()
                            item_parts.append(f"{formatted_key}: {value}")
                        formatted_items.append("\n".join(item_parts))
                    return "\n\n".join(formatted_items)
                else:
                    # Simple list formatting
                    return "\n".join([f"- {item}" for item in result])
            else:
                # Just mention the number of items for long lists
                return f"Found {len(result)} items. The first few are: \n" + "\n".join([f"- {item}" for item in result[:5]])
        
        # Fallback to string representation
        return str(result)
    
    async def _async_request(self, method: str, url: str, **kwargs) -> Any:
        """Make an async HTTP request"""
        loop = asyncio.get_event_loop()
        if method.upper() == "GET":
            return await loop.run_in_executor(
                None, lambda: requests.get(url, **kwargs)
            )
        else:
            return await loop.run_in_executor(
                None, lambda: requests.post(url, **kwargs)
            )

# Create singleton instance
api = CragDomainAdapter()
EOL

# Create the update script
echo "Creating update script..."
cat > "$DOMAIN_ADAPTER_DIR/update_agent.py" << 'EOL'
import os
import re

# Install the domain adapter
os.makedirs('/app/crag_domain_adapter', exist_ok=True)
with open('/app/crag_domain_adapter/__init__.py', 'w') as f:
    with open('/tmp/crag_domain_adapter.py', 'r') as src:
        f.write(src.read())

# Update main.py to use the adapter
main_file = '/app/main.py'
with open(main_file, 'r') as f:
    content = f.read()

print(f"Updating {main_file}")

# Add import for our adapter
import_section_end = content.find('\n\n', content.find('import '))
if import_section_end > 0:
    updated_content = content[:import_section_end] + "\nimport crag_domain_adapter\n" + content[import_section_end:]
else:
    # Fallback to simple replacement
    updated_content = content.replace("import requests", "import requests\nimport crag_domain_adapter")

# Replace the entire api_chat function with our version for clean indentation
api_chat_pattern = r'@app\.post\("/api/chat"\)[\s\S]*?async def api_chat\([^)]+\):[\s\S]*?return \{[^\}]+\}'
new_api_chat = '''@app.post("/api/chat")
async def api_chat(request: Request):
    logger.info("Received POST to /api/chat")
    
    # Parse the request body
    try:
        body = await request.json()
        logger.info(f"Raw request body: {body}")
        
        # Extract the message from the request body
        message = None
        if isinstance(body, dict):
            if "message" in body:
                message = body["message"]
                logger.info(f"Found message in 'message' field: {message}...")
        
        if not message:
            return {"response": "No message found in request", "status": "error"}
        
        logger.info(f"Processing message: {message}...")
        
        # Use the domain adapter to process the query
        logger.info("Using domain adapter to process query")
        response_data = await crag_domain_adapter.api.ask(message)
        
        # Return the response
        return {"response": response_data.get("response", "No response"), "status": "success"}
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {"response": f"Error processing request: {str(e)}", "status": "error"}'''

# Replace the entire function to avoid indentation issues
if re.search(api_chat_pattern, updated_content):
    updated_content = re.sub(api_chat_pattern, new_api_chat, updated_content)
else:
    print("Could not find the API chat function pattern, making simpler changes...")
    
    # Simple import update if function replacement fails
    if "import crag_domain_adapter" not in updated_content:
        updated_content = updated_content.replace("import requests", "import requests\nimport crag_domain_adapter")
    
    # Try to find and replace just the API call
    api_call = "response = requests.post("
    if api_call in updated_content:
        parts = updated_content.split(api_call, 1)
        indent = ""
        lines = parts[0].split('\n')
        if lines:
            for char in lines[-1]:
                if char.isspace():
                    indent += char
                else:
                    break
                    
        # Create replacement with proper indentation
        replacement = f"{indent}# Using domain adapter instead of direct API call\n"
        replacement += f"{indent}response_data = await crag_domain_adapter.api.ask(message)\n"
        replacement += f"{indent}class MockResponse:\n"
        replacement += f"{indent}    def __init__(self):\n"
        replacement += f"{indent}        self.status_code = 200\n"
        replacement += f"{indent}    def json(self):\n"
        replacement += f"{indent}        return {{\"response\": response_data.get(\"response\", \"\")}}\n"
        replacement += f"{indent}response = MockResponse()\n"
        
        updated_content = parts[0] + replacement + f"{indent}# Original: {api_call}" + parts[1].split(')', 1)[1]

# Write the updated content back
with open(main_file, 'w') as f:
    f.write(updated_content)

print("✅ Updated main.py to use the domain adapter")
EOL

# Also create a simple test script
echo "Creating test script..."
cat > "$DOMAIN_ADAPTER_DIR/test_domain_adapter.py" << 'EOL'
import asyncio
import crag_domain_adapter

async def test():
    print("Testing domain adapter...")
    result = await crag_domain_adapter.api.ask("What is the CRAG API?")
    print(f"Result: {result}")

if __name__ == "__main__":
    asyncio.run(test())
EOL

# Copy files to container
echo "Copying files to container..."
docker cp "$DOMAIN_ADAPTER_DIR/crag_domain_adapter.py" minimal-agent:/tmp/crag_domain_adapter.py
docker cp "$DOMAIN_ADAPTER_DIR/update_agent.py" minimal-agent:/tmp/update_agent.py
docker cp "$DOMAIN_ADAPTER_DIR/test_domain_adapter.py" minimal-agent:/tmp/test_domain_adapter.py

# Clean up temporary directory
rm -rf "$DOMAIN_ADAPTER_DIR"

# Run the update script
echo "Running update script in container..."
docker exec minimal-agent python /tmp/update_agent.py

# Restart the minimal agent
echo "Restarting minimal agent to apply changes..."
docker restart minimal-agent

# Wait for the container to restart
echo "Waiting for container to restart..."
sleep 5

# Test the setup
echo -e "\n=== TESTING THE SETUP ==="
echo "Sending a test request to the agent..."
curl -s -X POST \
     -H "Content-Type: application/json" \
     -d '{"message":"What is the CRAG API?"}' \
     http://localhost:8000/api/chat | jq 2>/dev/null || echo "Failed to parse response as JSON"

# Check if the server started correctly
echo -e "\nVerifying server startup..."
CONTAINER_LOGS=$(docker logs minimal-agent 2>&1 | grep -c "Application startup complete")

if [ "$CONTAINER_LOGS" -gt 0 ]; then
    echo "✅ The server is running correctly!"
else
    echo "⚠️ Server may have issues. View logs with: docker logs minimal-agent"
fi

echo ""
echo "=========================================================="
echo "SETUP COMPLETE"
echo "=========================================================="
echo ""
echo "The minimal agent and Mock API are now running and configured."
echo ""
echo "Mock API: Running on port 8080"
echo "Minimal Agent: Running on port 8000"
echo ""
echo "You can access the web interface at: http://localhost:8000"
echo ""
echo "IMPORTANT: The Mock API initialization takes several minutes."
echo "You may see messages about the API still initializing until this completes."
echo "To monitor the initialization: docker logs crag-mock-api"
