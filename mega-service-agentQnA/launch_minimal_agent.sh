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
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn
import os
import json

app = FastAPI()

@app.get("/", response_class=HTMLResponse)
async def root():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>OPEA Agent - Simplified</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #2c3e50; }
            .container { background-color: #f8f9fa; padding: 20px; border-radius: 5px; }
            .info { margin-bottom: 20px; }
            .api-url { background-color: #e9ecef; padding: 8px; border-radius: 4px; font-family: monospace; }
        </style>
    </head>
    <body>
        <h1>OPEA Agent - Simplified Interface</h1>
        <div class="container">
            <div class="info">
                <h2>Mock API Connection</h2>
                <p>Mock API is available at: <span class="api-url">http://host.docker.internal:8080</span></p>
            </div>
            <div class="info">
                <h2>Status</h2>
                <p>Agent is running in compatibility mode due to architecture differences</p>
                <p>This is a simplified version without JAX dependencies that were causing issues</p>
            </div>
            <div class="info">
                <h2>Available Endpoints</h2>
                <ul>
                    <li><code>/status</code> - Check system status</li>
                    <li><code>/docs</code> - API documentation</li>
                </ul>
            </div>
        </div>
    </body>
    </html>
    """
    return html_content

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

RUN pip install --no-cache-dir fastapi uvicorn jinja2

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
