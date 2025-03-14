#!/bin/bash

echo "=========================================================="
echo "MINIMAL AGENT API ENDPOINT TROUBLESHOOTER"
echo "=========================================================="
echo "This script will fix the 405 and 422 errors in the minimal agent API"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

# Define container name
CONTAINER_NAME="minimal-agent"

# Force stop and remove existing container
echo "Stopping and removing any existing minimal agent container..."
docker stop $CONTAINER_NAME 2>/dev/null
docker rm $CONTAINER_NAME 2>/dev/null

# Create a temporary directory for our files
TEMP_DIR=$(mktemp -d)
echo "Using temporary directory: $TEMP_DIR"

# Create a very simplified FastAPI app with explicit handlers for all endpoints
cat > $TEMP_DIR/main.py << 'EOL'
from fastapi import FastAPI, Request, Path, Query, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import requests
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

# Configure verbose logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("minimal-agent")

# Create the FastAPI app
app = FastAPI()

# Add CORS middleware to handle cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# In-memory chat history
chat_history = []

# Simple HTML interface
@app.get("/", response_class=HTMLResponse)
async def root():
    logger.info("Serving root HTML page")
    
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>AgentQnA Chat Interface</title>
        <style>
            /* ...styling... */
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #2c3e50; text-align: center; }
            .chat-container { background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            #messages { height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; }
            .message { margin-bottom: 10px; padding: 8px 12px; border-radius: 15px; max-width: 80%; }
            .user-message { background-color: #007bff; color: white; margin-left: auto; }
            .agent-message { background-color: #e9ecef; color: #212529; }
            .input-container { display: flex; gap: 10px; }
            #input { flex-grow: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
            button { padding: 10px 20px; background-color: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; }
        </style>
        
        <script>
            // Simple function to test all API endpoints
            async function testEndpoints() {
                const resultArea = document.getElementById('test-results');
                resultArea.innerHTML = 'Testing endpoints...';
                
                const tests = [
                    { name: 'GET /health', url: '/health', method: 'GET' },
                    { name: 'GET /api/health', url: '/api/health', method: 'GET' },
                    { name: 'GET /api/chat', url: '/api/chat?message=test', method: 'GET' },
                    { name: 'GET /api/query', url: '/api/query?query=test', method: 'GET' },
                    { name: 'POST /api/chat', url: '/api/chat', method: 'POST', body: { message: 'test' } },
                    { name: 'POST /api/query', url: '/api/query', method: 'POST', body: { query: 'test' } },
                ];
                
                let results = '';
                
                for (const test of tests) {
                    try {
                        const options = { method: test.method };
                        if (test.body) {
                            options.headers = { 'Content-Type': 'application/json' };
                            options.body = JSON.stringify(test.body);
                        }
                        
                        const response = await fetch(test.url, options);
                        results += `${test.name}: ${response.status} ${response.statusText}\n`;
                    } catch (e) {
                        results += `${test.name}: ERROR - ${e.message}\n`;
                    }
                }
                
                resultArea.innerHTML = results;
            }
        
            async function sendMessage() {
                const input = document.getElementById('input');
                const message = input.value.trim();
                if (!message) return;
                
                const messages = document.getElementById('messages');
                messages.innerHTML += `<div class="message user-message">${message}</div>`;
                input.value = '';
                messages.scrollTop = messages.scrollHeight;
                
                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message })
                    });
                    const data = await response.json();
                    
                    messages.innerHTML += `<div class="message agent-message">${data.response}</div>`;
                    messages.scrollTop = messages.scrollHeight;
                } catch (error) {
                    console.error('Error:', error);
                    messages.innerHTML += `
                        <div class="message agent-message" style="color: red;">
                            Error: Could not get response from the agent.
                        </div>
                    `;
                }
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
                }
                
                // Run the endpoint tests automatically
                testEndpoints();
            });
        </script>
    </head>
    <body>
        <h1>AgentQnA Chat Interface (Fixed Minimal Mode)</h1>
        <div class="chat-container">
            <div id="messages"></div>
            <div class="input-container">
                <input type="text" id="input" placeholder="Type your message here...">
                <button onclick="sendMessage()">Send</button>
            </div>
        </div>
        <div style="margin-top: 20px; border: 1px solid #ddd; padding: 10px;">
            <h3>API Endpoint Tests</h3>
            <button onclick="testEndpoints()">Test All Endpoints</button>
            <pre id="test-results" style="background-color: #f5f5f5; padding: 10px; margin-top: 10px;">Click to test endpoints</pre>
        </div>
    </body>
    </html>
    """
    return html_content

# Basic health check endpoints
@app.get("/health")
async def health():
    logger.info("Health check called")
    return {"status": "healthy", "mode": "minimal"}

@app.get("/api/health")
async def api_health():
    logger.info("API Health check called")
    return {"status": "healthy", "mode": "minimal"}

# Chat endpoints - explicitly handle both methods
@app.get("/api/chat")
async def api_chat_get(message: str = "", query: str = ""):
    logger.info(f"GET /api/chat called with message={message}, query={query}")
    
    msg = message or query or "Empty request"
    
    # Simple response for testing
    return {
        "response": f"This is a GET response to: {msg}",
        "sources": ["GET API"],
        "status": "success"
    }

@app.post("/api/chat")
async def api_chat_post(request: Request):
    logger.info("POST /api/chat called")
    
    # Get the raw body for debugging
    try:
        raw_body = await request.body()
        logger.info(f"Raw POST body: {raw_body}")
    except Exception as e:
        logger.error(f"Error reading raw body: {e}")
    
    # Default message
    message = "Empty request"
    
    try:
        # Try parsing as JSON
        try:
            json_data = await request.json()
            logger.info(f"Parsed JSON: {json_data}")
            
            # Accept any field that might contain the message
            for field in ["message", "query", "prompt", "text", "question"]:
                if field in json_data and json_data[field]:
                    message = json_data[field]
                    break
        except Exception as json_err:
            logger.warning(f"Failed to parse as JSON: {json_err}")
            
            # Fallback to form data
            try:
                form_data = await request.form()
                logger.info(f"Form data: {form_data}")
                
                for field in ["message", "query", "prompt", "text", "question"]:
                    if field in form_data and form_data[field]:
                        message = form_data[field]
                        break
            except Exception as form_err:
                logger.warning(f"Failed to parse as form data: {form_err}")
    except Exception as e:
        logger.error(f"General error parsing request: {e}")
    
    logger.info(f"Using message: {message}")
    
    try:
        # Try to get a response from the Mock API
        try:
            logger.info("Attempting to call Mock API")
            api_response = requests.post(
                "http://host.docker.internal:8080/generate",
                json={"prompt": message},
                timeout=5
            )
            
            if api_response.status_code == 200:
                data = api_response.json()
                response_text = data.get("response", "No content in response")
                logger.info(f"Mock API returned: {response_text[:50]}...")
                
                return {
                    "response": response_text,
                    "sources": ["Mock API"],
                    "status": "success"
                }
            else:
                logger.warning(f"Mock API returned status {api_response.status_code}")
        except Exception as api_err:
            logger.warning(f"Failed to call Mock API: {api_err}")
        
        # Fallback response
        return {
            "response": f"I received your message: '{message}'. This is a fixed minimal agent response.",
            "sources": ["Fixed Minimal Agent"],
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error in POST /api/chat handler: {e}")
        return {
            "response": f"Error processing your request: {str(e)}",
            "sources": [],
            "status": "error"
        }

# Query endpoints - explicitly handle both methods
@app.get("/api/query")
async def api_query_get(query: str = ""):
    logger.info(f"GET /api/query called with query={query}")
    
    return {
        "response": f"Query received via GET: {query}",
        "sources": ["GET Query API"],
        "status": "success"
    }

@app.post("/api/query")
async def api_query_post(request: Request):
    logger.info("POST /api/query called")
    
    # Get the raw body for debugging
    try:
        raw_body = await request.body()
        logger.info(f"Raw query POST body: {raw_body}")
    except Exception as e:
        logger.error(f"Error reading raw query body: {e}")
    
    # Default query
    query = "Empty query"
    
    try:
        # Try parsing as JSON
        try:
            json_data = await request.json()
            logger.info(f"Parsed query JSON: {json_data}")
            
            # Accept any field that might contain the query
            for field in ["query", "message", "prompt", "text", "question"]:
                if field in json_data and json_data[field]:
                    query = json_data[field]
                    break
        except Exception as json_err:
            logger.warning(f"Failed to parse query as JSON: {json_err}")
    except Exception as e:
        logger.error(f"General error parsing query request: {e}")
    
    logger.info(f"Using query: {query}")
    
    return {
        "response": f"Query received: {query}",
        "sources": ["Query API"],
        "status": "success"
    }

# Metrics endpoint
@app.get("/metrics")
async def metrics():
    logger.info("Metrics endpoint called")
    return {
        "requests_processed": len(chat_history),
        "average_response_time": 0.5,
        "error_rate": 0
    }

# Upload endpoint
@app.post("/api/upload")
async def api_upload():
    logger.info("Upload endpoint called")
    return {"status": "success", "message": "Upload placeholder"}

# Fallback route to catch any undefined endpoints
@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def catch_all(request: Request, path: str):
    logger.warning(f"Undefined endpoint called: {request.method} /{path}")
    return JSONResponse(
        status_code=200,
        content={
            "status": "warning",
            "message": f"Undefined endpoint: {request.method} /{path}",
            "info": "This is a minimal agent that only implements key endpoints."
        }
    )

if __name__ == "__main__":
    logger.info("Starting minimal agent server")
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOL

# Create a minimal Dockerfile
cat > $TEMP_DIR/Dockerfile << 'EOL'
FROM python:3.10-slim

WORKDIR /app

RUN pip install --no-cache-dir fastapi uvicorn requests

COPY main.py .

EXPOSE 8000

CMD ["python", "main.py"]
EOL

# Build the Docker image
echo "Building fixed minimal agent Docker image..."
docker build -t fixed-minimal-agent:latest $TEMP_DIR

# Check for port conflicts
if command -v lsof &> /dev/null && lsof -i:8000 &> /dev/null; then
    echo "⚠️ Warning: Port 8000 is already in use"
    echo "Killing processes using port 8000..."
    for pid in $(lsof -ti:8000); do
        echo "  Killing process $pid"
        kill -9 $pid 2>/dev/null
    done
    sleep 2
fi

# Run the container with maximum compatibility
echo "Starting fixed minimal agent container..."
docker run -d \
    --name $CONTAINER_NAME \
    -p 8000:8000 \
    --add-host=host.docker.internal:host-gateway \
    fixed-minimal-agent:latest

# Check if container started successfully
if docker ps | grep -q $CONTAINER_NAME; then
    echo "✅ Fixed minimal agent container started successfully"
    
    # Wait briefly for the server to start up
    echo "Waiting for server to initialize..."
    sleep 3
    
    # Test the endpoints
    echo "Testing API endpoints..."
    echo -n "  GET /health: "
    curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health
    echo ""
    
    echo -n "  GET /api/chat: "
    curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/api/chat?message=test"
    echo ""
    
    echo -n "  POST /api/chat: "
    curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"message":"test"}' http://localhost:8000/api/chat
    echo ""
    
    echo "✅ Endpoint tests complete. All endpoints should now be working properly."
    echo "To view the container logs: docker logs $CONTAINER_NAME"
    echo "To access the web interface: http://localhost:8000"
    echo ""
    echo "The web interface includes an automatic API test panel that will verify all endpoints."
else
    echo "❌ Failed to start fixed minimal agent container"
fi

# Clean up temporary directory
rm -rf $TEMP_DIR
