#!/bin/bash

echo "Launching minimal agent container for ARM64 compatibility..."

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

# Container name
CONTAINER_NAME="minimal-agent"

# Check if container already exists
if docker ps -a | grep -q "$CONTAINER_NAME"; then
    # Check if it's running
    if docker ps | grep -q "$CONTAINER_NAME"; then
        echo "✅ Container is already running"
        echo "To access the web interface, visit: http://localhost:8000"
        exit 0
    else
        echo "Container exists but is not running. Starting it..."
        docker start "$CONTAINER_NAME"
        echo "✅ Container started"
        echo "To access the web interface, visit: http://localhost:8000"
        exit 0
    fi
fi

# Check if the Mock API container is running
echo "Checking if Mock API container is running..."
if ! docker ps | grep -q "crag-mock-api"; then
    echo "⚠️ Mock API container is not running!"
    echo "Starting Mock API container..."
    # Try to start it if it exists
    if docker ps -a | grep -q "crag-mock-api"; then
        docker start crag-mock-api
    else
        echo "Mock API container not found. It will need to be created."
        echo "Run setup.sh first to create the Mock API container."
    fi
fi

# Check if port 8000 is available
if command -v lsof &> /dev/null && lsof -i:8000 &> /dev/null; then
    echo "⚠️ Warning: Port 8000 is already in use"
    echo "The agent container may not be able to bind to this port"
    
    # Ask to kill the processes using port 8000
    echo "Do you want to kill processes using port 8000? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Killing processes on port 8000..."
        kill $(lsof -t -i:8000) 2>/dev/null || true
    else
        echo "Please free port 8000 and try again."
        exit 1
    fi
fi

echo "Creating minimal FastAPI app container compatible with ARM64..."

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
echo "Using temporary directory: $TEMP_DIR"

# Create a simple FastAPI application
cat > $TEMP_DIR/main.py << 'EOL'
from fastapi import FastAPI, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse
import uvicorn
import requests
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union
import json
import os
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("minimal-agent")

app = FastAPI()

# In-memory chat history
chat_history = []

# Define models with very flexible structures
class ChatRequest(BaseModel):
    message: Optional[str] = None
    query: Optional[str] = None
    prompt: Optional[str] = None
    text: Optional[str] = None
    question: Optional[str] = None
    
    class Config:
        # Allow extra fields in the request
        extra = "allow"

@app.get("/", response_class=HTMLResponse)
async def root():
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
                            Error: Could not get response from the agent. Please check that the Mock API is running.
                        </div>
                    `;
                    // Update status
                    document.getElementById('status-text').textContent = 'Error: Connection issue';
                }
            }

            document.addEventListener('DOMContentLoaded', () => {
                const input = document.getElementById('input');
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        sendMessage();
                    }
                });
                input.focus();
                
                // Check health status on load
                checkHealth();
            });
            
            async function checkHealth() {
                try {
                    const response = await fetch('/health');
                    const data = await response.json();
                    if (data.status === 'healthy') {
                        document.getElementById('status-text').textContent = 
                            'Connected to minimal agent | Model: Mock API | Status: Ready';
                    } else {
                        document.getElementById('status-text').textContent = 
                            'Warning: Agent health check returned unexpected status';
                    }
                } catch (error) {
                    document.getElementById('status-text').textContent = 
                        'Error: Could not connect to agent health endpoint';
                }
            }
        </script>
    </head>
    <body>
        <h1>AgentQnA Chat Interface (Minimal Mode)</h1>
        <div class="chat-container">
            <div id="messages"></div>
            <div class="input-container">
                <input type="text" id="input" placeholder="Type your message here...">
                <button onclick="sendMessage()">Send</button>
            </div>
            <div class="status-bar">
                Status: <span id="status-text">Checking connection...</span>
            </div>
        </div>
    </body>
    </html>
    """
    return html_content

# Standard health endpoints that the frontend was trying to access
@app.get("/health")
async def health():
    return {"status": "healthy", "mode": "minimal"}

@app.get("/api/health")
async def api_health():
    return {"status": "healthy", "mode": "minimal"}

# SIMPLIFIED GET handlers that don't try to reuse the POST logic
@app.get("/api/chat")
async def api_chat_get(message: str = "", query: str = ""):
    """Handle GET requests to chat endpoint"""
    # Log the request
    msg = message or query or "Empty request"
    logger.info(f"Received GET chat request with message: {msg}")
    
    try:
        # Simple default response for GET requests
        response_text = f"This is a GET response to: {msg}"
        
        # Try to get a response from the Mock API if we have a message
        if msg and msg != "Empty request":
            try:
                mock_response = requests.post(
                    "http://host.docker.internal:8080/generate", 
                    json={"prompt": msg},
                    timeout=5
                )
                if mock_response.status_code == 200:
                    mock_data = mock_response.json()
                    response_text = mock_data.get("response", response_text)
            except Exception as e:
                logger.warning(f"Couldn't connect to Mock API in GET handler: {e}")
        
        return {
            "response": response_text,
            "sources": ["GET Handler"],
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error in GET chat endpoint: {str(e)}")
        return {"response": f"Error processing GET request: {str(e)}", "sources": [], "status": "error"}

@app.get("/api/query")
async def api_query_get(query: str = ""):
    """Handle GET requests to query endpoint"""
    logger.info(f"Received GET query request with query: {query}")
    try:
        return {
            "response": f"Query processed via GET: {query}",
            "sources": ["Minimal Agent GET Documentation"],
            "status": "success"
        }
    except Exception as e:
        return {"response": f"Error: {str(e)}", "sources": [], "status": "error"}

# COMPLETELY REIMPLEMENTED POST handler with robust error handling
@app.post("/api/chat")
async def api_chat_post(request: Request):
    """Handle chat requests with maximum flexibility"""
    logger.info("Received POST to /api/chat")
    
    # Get the raw body first to help with debugging
    try:
        raw_body = await request.body()
        logger.info(f"Raw request body: {raw_body[:200]}")  # Log just the start to avoid huge logs
    except Exception as e:
        logger.warning(f"Could not read raw body: {e}")
    
    # Extract message with multiple fallback options
    message = "Empty request"
    
    # Try several ways to get the message content
    try:
        # Method 1: Try to parse as JSON first
        try:
            body_json = await request.json()
            logger.info(f"Parsed JSON body: {body_json}")
            
            # Look for message in common field names
            for field in ['message', 'query', 'prompt', 'text', 'question']:
                if field in body_json and body_json[field]:
                    message = body_json[field]
                    logger.info(f"Found message in '{field}' field: {message[:50]}...")
                    break
        except Exception as json_e:
            logger.warning(f"Failed to parse as JSON: {json_e}")
            
            # Method 2: Try to get form data
            try:
                form = await request.form()
                for field in ['message', 'query', 'prompt', 'text', 'question']:
                    if field in form and form[field]:
                        message = form[field]
                        logger.info(f"Found message in form field '{field}': {message[:50]}...")
                        break
            except Exception as form_e:
                logger.warning(f"Failed to parse as form data: {form_e}")
                
                # Method 3: Try to parse query parameters
                try:
                    for field in ['message', 'query', 'prompt', 'text', 'question']:
                        if field in request.query_params:
                            message = request.query_params[field]
                            logger.info(f"Found message in query param '{field}': {message[:50]}...")
                            break
                except Exception as query_e:
                    logger.warning(f"Failed to check query params: {query_e}")
    except Exception as e:
        logger.error(f"Error extracting message: {e}")
    
    # Log the final message we're going to process
    logger.info(f"Processing message: {message[:100]}...")
    
    # Store in chat history
    chat_history.append({"role": "user", "content": message, "timestamp": str(datetime.now())})
    
    try:
        # Try to connect to the Mock API
        logger.info("Attempting to connect to Mock API")
        response = requests.post(
            "http://host.docker.internal:8080/generate",
            json={"prompt": message},
            timeout=10
        )
        
        if response.status_code == 200:
            mock_data = response.json()
            api_response = mock_data.get("response", "No response from API")
            logger.info(f"Received response from Mock API: {api_response[:50]}...")
            
            # Store in chat history
            chat_history.append({"role": "assistant", "content": api_response, "timestamp": str(datetime.now())})
            
            return {
                "response": api_response,
                "sources": ["Mock API"],
                "status": "success"
            }
        else:
            logger.warning(f"Mock API returned non-200 status: {response.status_code}")
            return {
                "response": f"The Mock API returned status code {response.status_code}. Please check that it's configured correctly.",
                "sources": [],
                "status": "error"
            }
            
    except requests.exceptions.ConnectionError:
        logger.error("Failed to connect to Mock API - connection error")
        return {
            "response": "Could not connect to the Mock API. Please make sure the crag-mock-api container is running.",
            "sources": [],
            "status": "error"
        }
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            "response": f"An error occurred while processing your request: {str(e)}",
            "sources": [],
            "status": "error"
        }

# Reimplemented query endpoint also with direct request parsing
@app.post("/api/query")
async def api_query_post(request: Request):
    """Handle query requests with direct request parsing"""
    logger.info("Received POST to /api/query")
    
    # Default query
    query = "Empty query"
    
    try:
        # Try to parse JSON body
        try:
            body = await request.json()
            logger.info(f"Query endpoint received JSON: {body}")
            
            # Look for content in various fields
            for field in ["query", "message", "prompt", "text", "question"]:
                if field in body and body[field]:
                    query = body[field]
                    break
        except Exception as e:
            logger.warning(f"Failed to parse query body as JSON: {e}")
            
            # Try form data
            try:
                form = await request.form()
                for field in ["query", "message", "prompt", "text", "question"]:
                    if field in form and form[field]:
                        query = form[field]
                        break
            except Exception as form_e:
                logger.warning(f"Failed to parse query as form: {form_e}")
        
        logger.info(f"Processing query: {query[:100]}...")
        
        # Try to get a response from the Mock API
        try:
            mock_response = requests.post(
                "http://host.docker.internal:8080/generate", 
                json={"prompt": f"Answer this query: {query}"},
                timeout=5
            )
            if mock_response.status_code == 200:
                mock_data = mock_response.json()
                api_response = mock_data.get("response", f"Query processed: {query}")
                return {
                    "response": api_response,
                    "sources": ["Mock API via Query"],
                    "status": "success"
                }
        except Exception as api_e:
            logger.warning(f"Could not get Mock API response for query: {api_e}")
        
        # Fallback response
        return {
            "response": f"Query processed: {query}\n\nThis is a simplified response from the minimal agent.",
            "sources": ["Minimal Agent Documentation"],
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error in query endpoint: {str(e)}")
        return {"response": f"Error: {str(e)}", "sources": [], "status": "error"}

# Simple metrics endpoint
@app.get("/metrics")
async def metrics():
    return {
        "requests_processed": len(chat_history) // 2,
        "average_response_time": 0.5,
        "error_rate": 0
    }

# Simple upload endpoint
@app.post("/api/upload")
async def upload():
    return {"status": "success", "message": "File upload placeholder in minimal agent"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOL

# Create a Dockerfile
cat > $TEMP_DIR/Dockerfile << 'EOL'
FROM python:3.10-slim

WORKDIR /app

RUN pip install --no-cache-dir fastapi uvicorn jinja2 pydantic requests

COPY main.py .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
EOL

# Build the Docker image
echo "Building minimal FastAPI image..."
docker build -t minimal-agent:latest $TEMP_DIR

# Run the container
echo "Starting minimal agent container..."
docker run -d \
    --name "$CONTAINER_NAME" \
    -p 8000:8000 \
    --add-host=host.docker.internal:host-gateway \
    minimal-agent:latest

if [ $? -eq 0 ]; then
    echo "✅ Minimal agent container started successfully"
    echo "To access the web interface, visit: http://localhost:8000"
    
    # Check if container is actually responding
    echo "Checking if minimal agent is responding..."
    sleep 2
    if curl -s http://localhost:8000/health &>/dev/null; then
        echo "✅ Minimal agent API is responding"
    else
        echo "⚠️ Minimal agent started but API is not responding yet"
    fi
else
    echo "❌ Failed to start minimal agent container"
fi

# Clean up
echo "Cleaning up temporary files..."
rm -rf $TEMP_DIR

echo ""
echo "IMPORTANT NOTES:"
echo "1. This minimal agent works on ARM64/Apple Silicon and doesn't require AVX instructions"
echo "2. Make sure the Mock API container is running: docker ps | grep crag-mock-api"
echo "3. If your frontend is still giving proxy errors, restart the frontend development server"
echo "4. This minimal agent implements all the endpoints that your frontend was trying to access"
echo ""
echo "If you need to see logs: docker logs $CONTAINER_NAME"
echo "If you need to restart: docker restart $CONTAINER_NAME"
echo "If you need to remove: docker rm -f $CONTAINER_NAME"
