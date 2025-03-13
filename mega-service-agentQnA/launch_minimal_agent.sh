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

# Check if port 8000 is available
if command -v lsof &> /dev/null && lsof -i:8000 &> /dev/null; then
    echo "⚠️ Warning: Port 8000 is already in use"
    echo "The agent container may not be able to bind to this port"
fi

echo "Creating minimal FastAPI app container compatible with ARM64..."

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
echo "Using temporary directory: $TEMP_DIR"

# Create a simple FastAPI application
cat > $TEMP_DIR/main.py << 'EOL'
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
import uvicorn
from pydantic import BaseModel

app = FastAPI()

class ChatRequest(BaseModel):
    message: str

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

                try {
                    const response = await fetch('/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message })
                    });
                    const data = await response.json();
                    messages.innerHTML += `
                        <div class="message agent-message">${data.response}</div>
                    `;
                    messages.scrollTop = messages.scrollHeight;
                } catch (error) {
                    console.error('Error:', error);
                    messages.innerHTML += `
                        <div class="message agent-message" style="color: red;">
                            Error: Could not get response from the agent
                        </div>
                    `;
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
            });
        </script>
    </head>
    <body>
        <h1>AgentQnA Chat Interface</h1>
        <div class="chat-container">
            <div id="messages"></div>
            <div class="input-container">
                <input type="text" id="input" placeholder="Type your message here...">
                <button onclick="sendMessage()">Send</button>
            </div>
            <div class="status-bar">
                Status: Connected to minimal agent | Model: Test Mode
            </div>
        </div>
    </body>
    </html>
    """
    return html_content

@app.post("/chat")
async def chat(request: ChatRequest):
    # Simple echo response for now
    return {
        "response": f"I received your message: {request.message}\nThis is a mock response as the full model integration is not implemented in the minimal version."
    }

@app.get("/status")
async def status():
    return {
        "status": "running",
        "platform": "simplified_agent",
        "compatibility_mode": True,
        "mock_api_url": "http://host.docker.internal:8080"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOL

# Create a Dockerfile
cat > $TEMP_DIR/Dockerfile << 'EOL'
FROM python:3.10-slim

WORKDIR /app

RUN pip install --no-cache-dir fastapi uvicorn jinja2 pydantic

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
else
    echo "❌ Failed to start minimal agent container"
fi

# Clean up
echo "Cleaning up temporary files..."
rm -rf $TEMP_DIR

echo "You can use this minimal agent for basic interaction with the mock API"
echo "For full functionality, consider using a native ARM64 build of the agent"
