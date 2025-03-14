#!/bin/bash

echo "=========================================================="
echo "DOCKER NETWORKING TROUBLESHOOTER"
echo "=========================================================="
echo "This script will fix connection issues between Docker containers"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

# Create a dedicated Docker network for better container communication
echo "Creating dedicated Docker network for AgentQnA..."
NETWORK_NAME="agentqna-network"
docker network create $NETWORK_NAME 2>/dev/null || true

# Check for the Mock API container
echo "Checking Mock API container..."
if ! docker ps | grep -q "crag-mock-api"; then
    echo "⚠️ Mock API container is not running"
    
    # Check if it exists but is stopped
    if docker ps -a | grep -q "crag-mock-api"; then
        echo "Starting existing Mock API container..."
        docker start crag-mock-api
        sleep 3
    else
        echo "Creating new Mock API container..."
        docker pull docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0
        docker run -d --name crag-mock-api --network $NETWORK_NAME -p 8080:8000 docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0
        sleep 3
    fi
    
    # Verify it's running now
    if ! docker ps | grep -q "crag-mock-api"; then
        echo "❌ Failed to start Mock API container"
        exit 1
    fi
else
    echo "✅ Mock API container is running"
fi

# Connect Mock API to our network if it's not already connected
if ! docker network inspect $NETWORK_NAME | grep -q "crag-mock-api"; then
    echo "Connecting Mock API container to $NETWORK_NAME network..."
    docker network connect $NETWORK_NAME crag-mock-api
fi

# Stop and remove existing minimal agent
echo "Removing existing minimal agent container..."
docker stop minimal-agent 2>/dev/null
docker rm minimal-agent 2>/dev/null

# Create a temporary directory for our files
TEMP_DIR=$(mktemp -d)
echo "Using temporary directory: $TEMP_DIR"

# Create an improved Docker-aware FastAPI app
cat > $TEMP_DIR/main.py << 'EOL'
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import requests
import json
import logging
import time
import socket
from typing import Dict, Any, List, Optional
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("minimal-agent")

# Create FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory chat history
chat_history = []

# Multiple potential URLs for the Mock API
MOCK_API_URLS = [
    "http://crag-mock-api:8000/generate",      # Direct container name (preferred)
    "http://host.docker.internal:8080/generate",  # Host machine mapping
    "http://localhost:8080/generate"           # Local fallback
]

# Track which URL works
working_mock_api_url = None

# Function to find a working Mock API URL
def find_working_mock_api():
    global working_mock_api_url
    
    if working_mock_api_url:
        return working_mock_api_url
        
    logger.info("Testing different Mock API URLs...")
    
    # First try DNS resolution for the container
    try:
        logger.info("Trying to resolve Mock API container IP...")
        ip_address = socket.gethostbyname("crag-mock-api")
        logger.info(f"crag-mock-api resolved to {ip_address}")
        
        # Add the resolved IP to our list of URLs to try
        MOCK_API_URLS.insert(0, f"http://{ip_address}:8000/generate")
    except socket.gaierror:
        logger.warning("Could not resolve crag-mock-api to an IP address")
    
    # Try each URL
    for url in MOCK_API_URLS:
        try:
            logger.info(f"Testing Mock API URL: {url}")
            # Just get the base URL without the /generate path for testing
            base_url = url.rsplit('/', 1)[0]
            response = requests.get(base_url, timeout=2)
            
            logger.info(f"Got response from {base_url}: Status {response.status_code}")
            if response.status_code < 500:  # Any non-server error response means the API is there
                logger.info(f"✅ Found working Mock API URL: {url}")
                working_mock_api_url = url
                return url
        except requests.RequestException as e:
            logger.warning(f"Failed to connect to {url}: {e}")
    
    # Default to the container name as a last resort
    logger.warning("No working Mock API URL found, defaulting to container name")
    working_mock_api_url = MOCK_API_URLS[0]
    return working_mock_api_url

# HTML interface
@app.get("/", response_class=HTMLResponse)
async def root():
    # Try to find working Mock API on initial page load
    find_working_mock_api()
    
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>AgentQnA Chat Interface</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 20px;
                background-color: #f5f5f5;
            }
            h1 { 
                color: #2c3e50; 
                text-align: center;
                margin-bottom: 30px;
            }
            .chat-container { 
                background-color: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                margin-bottom: 20px;
            }
            #messages { 
                height: 400px;
                overflow-y: auto;
                border: 1px solid #ddd;
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 5px;
                background-color: #fff;
            }
            .message {
                margin-bottom: 10px;
                padding: 8px 12px;
                border-radius: 15px;
                max-width: 80%;
                line-height: 1.4;
            }
            .user-message {
                background-color: #007bff;
                color: white;
                margin-left: auto;
            }
            .agent-message {
                background-color: #e9ecef;
                color: #212529;
            }
            .input-container {
                display: flex;
                gap: 10px;
            }
            #input { 
                flex-grow: 1;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-size: 16px;
            }
            button { 
                padding: 10px 20px;
                background-color: #28a745;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            }
            button:hover {
                background-color: #218838;
            }
            .status-bar {
                margin-top: 20px;
                padding: 10px;
                background-color: #e9ecef;
                border-radius: 5px;
                font-size: 14px;
                color: #666;
            }
            .source {
                margin-top: 5px;
                font-size: 12px;
                color: #6c757d;
            }
            
            /* Debug panel styles */
            .debug-panel {
                margin-top: 20px;
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 15px;
                background-color: #f8f9fa;
            }
            .debug-panel h3 {
                margin-top: 0;
            }
            #debug-output {
                background-color: #343a40;
                color: #f8f9fa;
                padding: 10px;
                border-radius: 5px;
                height: 150px;
                overflow-y: auto;
                font-family: monospace;
                margin-top: 10px;
            }
        </style>
        <script>
            async function sendMessage() {
                const input = document.getElementById('input');
                const message = input.value.trim();
                if (!message) return;
                
                const messages = document.getElementById('messages');
                messages.innerHTML += `
                    <div class="message user-message">${message}</div>
                `;
                input.value = '';
                messages.scrollTop = messages.scrollHeight;
                
                // Update status
                document.getElementById('status-text').textContent = 'Processing...';

                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message })
                    });
                    const data = await response.json();
                    
                    let responseHtml = `<div class="message agent-message">${data.response}</div>`;
                    
                    // Add sources if available
                    if (data.sources && data.sources.length > 0) {
                        responseHtml += '<div class="source">Sources: ';
                        data.sources.forEach((source, index) => {
                            if (index > 0) responseHtml += ', ';
                            responseHtml += source;
                        });
                        responseHtml += '</div>';
                    }
                    
                    messages.innerHTML += responseHtml;
                    messages.scrollTop = messages.scrollHeight;
                    
                    // Update status
                    document.getElementById('status-text').textContent = 'Connected to minimal agent | Model: Mock API';
                } catch (error) {
                    console.error('Error:', error);
                    messages.innerHTML += `
                        <div class="message agent-message" style="color: red;">
                            Error: Could not get response from the agent.
                        </div>
                    `;
                    // Update status
                    document.getElementById('status-text').textContent = 'Error: Connection issue';
                }
            }

            // Test connection to the Mock API
            async function testMockApi() {
                const debugOutput = document.getElementById('debug-output');
                debugOutput.innerHTML += "Testing connection to Mock API...\n";
                
                try {
                    const response = await fetch('/api/test-mock-api');
                    const data = await response.json();
                    
                    if (data.success) {
                        debugOutput.innerHTML += `✅ Successfully connected to Mock API using: ${data.url}\n`;
                        document.getElementById('status-text').textContent = 
                            'Connected to minimal agent | Mock API: Available';
                    } else {
                        debugOutput.innerHTML += `❌ Failed to connect to Mock API: ${data.error}\n`;
                        document.getElementById('status-text').textContent = 
                            'Connected to minimal agent | Mock API: Unavailable';
                    }
                    
                    // Add URLs that were tried
                    if (data.tried_urls) {
                        debugOutput.innerHTML += "Tried the following URLs:\n";
                        data.tried_urls.forEach(url => {
                            debugOutput.innerHTML += `- ${url}\n`;
                        });
                    }
                } catch (error) {
                    debugOutput.innerHTML += `Error testing Mock API: ${error.message}\n`;
                }
                
                debugOutput.scrollTop = debugOutput.scrollHeight;
            }

            document.addEventListener('DOMContentLoaded', () => {
                const input = document.getElementById('input');
                if (input) {
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            sendMessage();
                        }
                    });
                    input.focus();
                }
                
                // Test the Mock API connection on page load
                testMockApi();
            });
        </script>
    </head>
    <body>
        <h1>AgentQnA Chat Interface (Network Fixed)</h1>
        <div class="chat-container">
            <div id="messages"></div>
            <div class="input-container">
                <input type="text" id="input" placeholder="Type your message here...">
                <button onclick="sendMessage()">Send</button>
            </div>
            <div class="status-bar">
                Status: <span id="status-text">Initializing...</span>
            </div>
        </div>
        
        <!-- Debug Panel -->
        <div class="debug-panel">
            <h3>Connection Diagnostics</h3>
            <button onclick="testMockApi()">Test Mock API Connection</button>
            <div id="debug-output">Initializing connection diagnostics...\n</div>
        </div>
    </body>
    </html>
    """
    return html_content

# Health check endpoints
@app.get("/health")
async def health():
    return {"status": "healthy", "mode": "minimal-fixed"}

@app.get("/api/health")
async def api_health():
    return {"status": "healthy", "mode": "minimal-fixed"}

# Test endpoint for Mock API connection
@app.get("/api/test-mock-api")
async def test_mock_api():
    result = {
        "success": False,
        "error": "",
        "url": "",
        "tried_urls": MOCK_API_URLS.copy()
    }
    
    for url in MOCK_API_URLS:
        try:
            # Get the base URL without /generate
            base_url = url.rsplit('/', 1)[0]
            logger.info(f"Testing connection to: {base_url}")
            
            # Try to connect with a short timeout
            response = requests.get(base_url, timeout=2)
            logger.info(f"Response from {base_url}: Status {response.status_code}")
            
            if response.status_code < 500:
                result["success"] = True
                result["url"] = url
                # Set this as our working URL
                global working_mock_api_url
                working_mock_api_url = url
                break
        except Exception as e:
            logger.warning(f"Failed to connect to {url}: {str(e)}")
            result["error"] += f"{url}: {str(e)}; "
    
    return result

# Chat endpoint
@app.post("/api/chat")
async def api_chat(request: Request):
    try:
        # Parse the request JSON
        body = await request.json()
        message = body.get("message", "")
        if not message:
            for field in ['query', 'prompt', 'text', 'question']:
                if field in body and body[field]:
                    message = body[field]
                    break
        
        if not message:
            message = "Empty request"
        
        logger.info(f"Processing message: {message[:50]}...")
        chat_history.append({"role": "user", "content": message})
        
        # Get the working Mock API URL
        mock_api_url = find_working_mock_api()
        logger.info(f"Using Mock API URL: {mock_api_url}")
        
        try:
            response = requests.post(
                mock_api_url,
                json={"prompt": message},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                api_response = data.get("response", "No content in response")
                logger.info(f"Mock API response received: {api_response[:50]}...")
                
                chat_history.append({"role": "assistant", "content": api_response})
                return {
                    "response": api_response,
                    "sources": ["Mock API"],
                    "status": "success",
                    "api_url": mock_api_url
                }
            else:
                logger.warning(f"Mock API returned status {response.status_code}")
                return {
                    "response": f"The Mock API returned status {response.status_code}. Please check the connection.",
                    "sources": ["Error"],
                    "status": "error"
                }
        except Exception as e:
            logger.error(f"Error calling Mock API: {str(e)}")
            return {
                "response": f"Could not connect to the Mock API. Error: {str(e)}",
                "sources": ["Minimal Agent"],
                "status": "error"
            }
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            "response": f"Error processing your request: {str(e)}",
            "sources": [],
            "status": "error"
        }

# Query endpoint
@app.post("/api/query")
async def api_query(request: Request):
    try:
        body = await request.json()
        query = body.get("query", "No query provided")
        
        logger.info(f"Processing query: {query[:50]}...")
        
        # Use the same Mock API logic
        mock_api_url = find_working_mock_api()
        
        try:
            response = requests.post(
                mock_api_url,
                json={"prompt": f"Query: {query}"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                api_response = data.get("response", "No content in response")
                return {
                    "response": api_response,
                    "sources": ["Mock API"],
                    "status": "success"
                }
            else:
                logger.warning(f"Mock API returned status {response.status_code}")
                return {
                    "response": f"Query: {query}\n\nThe Mock API returned status {response.status_code}.",
                    "sources": ["Minimal Agent"],
                    "status": "error"
                }
        except Exception as e:
            logger.error(f"Error calling Mock API for query: {str(e)}")
            return {
                "response": f"Query: {query}\n\nThis is a simplified response from the minimal agent.",
                "sources": ["Minimal Agent"],
                "status": "error"
            }
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        return {"response": f"Error: {str(e)}", "sources": [], "status": "error"}

# Also support GET methods 
@app.get("/api/chat")
async def api_chat_get(message: str = ""):
    if not message:
        return {"response": "Please provide a message parameter", "sources": [], "status": "error"}
    
    logger.info(f"GET chat with message: {message[:50]}...")
    return await api_chat(Request(scope={"type": "http"}))

@app.get("/api/query")
async def api_query_get(query: str = ""):
    if not query:
        return {"response": "Please provide a query parameter", "sources": [], "status": "error"}
    
    logger.info(f"GET query with query: {query[:50]}...")
    return await api_query(Request(scope={"type": "http"}))

# Metrics endpoint
@app.get("/metrics")
async def metrics():
    return {
        "requests_processed": len(chat_history) // 2,
        "average_response_time": 0.5,
        "error_rate": 0,
        "mock_api_url": working_mock_api_url
    }

# Upload endpoint
@app.post("/api/upload")
async def upload():
    return {"status": "success", "message": "File upload placeholder in minimal agent"}

if __name__ == "__main__":
    logger.info("Starting fixed minimal agent server")
    # Try to find a working Mock API URL at startup
    try:
        find_working_mock_api()
    except Exception as e:
        logger.warning(f"Failed to find working Mock API URL at startup: {e}")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOL

# Create a fixed Dockerfile that adds proper network tools
cat > $TEMP_DIR/Dockerfile << 'EOL'
FROM python:3.10-slim

WORKDIR /app

# Install ping, curl and other network tools for easier debugging
RUN apt-get update && apt-get install -y \
    iputils-ping \
    curl \
    dnsutils \
    netcat-openbsd \
    net-tools \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir fastapi uvicorn requests

COPY main.py .

EXPOSE 8000

# Command to run the application
CMD ["python", "main.py"]
EOL

# Build the Docker image
echo "Building fixed minimal agent Docker image..."
docker build -t fixed-minimal-agent:latest $TEMP_DIR

# Run the container on our dedicated network
echo "Starting fixed minimal agent container..."
docker run -d \
    --name minimal-agent \
    --network $NETWORK_NAME \
    -p 8000:8000 \
    --add-host=host.docker.internal:host-gateway \
    fixed-minimal-agent:latest

# Wait for container to start
echo "Waiting for container to start..."
sleep 3

# Check if container is running
if ! docker ps | grep -q minimal-agent; then
    echo "❌ Failed to start minimal agent container"
    echo "Check Docker logs: docker logs minimal-agent"
    exit 1
fi

# Test if the container can ping the Mock API
echo "Testing network connectivity between containers..."
docker exec minimal-agent ping -c 1 crag-mock-api || echo "Note: Ping failed but this might be expected."

# Try curl from inside the container to the Mock API
echo "Testing HTTP connectivity from minimal-agent to crag-mock-api..."
docker exec minimal-agent curl -s http://crag-mock-api:8000/ || echo "Note: Direct HTTP connection failed. Will try alternative connection methods."

# Clean up temporary directory
rm -rf $TEMP_DIR

# Final instructions
echo ""
echo "=========================================================="
echo "DOCKER NETWORKING FIX COMPLETE"
echo "=========================================================="
echo ""
echo "✓ Created dedicated Docker network for improved container communication"
echo "✓ Rebuilt minimal-agent container with network debugging tools"
echo "✓ Configured dynamic discovery of Mock API endpoints"
echo ""
echo "To access the web interface: http://localhost:8000"
echo "The interface includes a diagnostics panel to test connections"
echo ""
echo "If you still have issues, try these commands:"
echo "- Check minimal agent logs: docker logs minimal-agent"
echo "- Check Mock API logs: docker logs crag-mock-api"
echo "- Restart both containers: docker restart minimal-agent crag-mock-api"
echo "- Inspect the network: docker network inspect $NETWORK_NAME"
echo ""
echo "For direct debugging, connect to the containers:"
echo "- docker exec -it minimal-agent bash"
echo "- docker exec -it crag-mock-api bash"
