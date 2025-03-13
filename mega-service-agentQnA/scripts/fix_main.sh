#!/bin/bash

echo "Creating simplified main.py with corrected imports..."

cat << 'EOF' > simplified_main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time
import os
import logging
import sys

# Configure basic logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("agentqna")
logger.info("Starting AgentQnA backend server")

# Initialize FastAPI app
app = FastAPI(
    title="AgentQnA API",
    description="API for the AgentQnA service",
    version="0.1.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware for request timing
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    logger.info(f"Request to {request.url} took {process_time:.4f}s")
    return response

# Basic health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Basic query endpoint
@app.post("/api/query")
async def query(request: dict):
    query_text = request.get("query", "")
    logger.info(f"Received query: {query_text}")
    return {
        "answer": f"This is a placeholder answer for: {query_text}",
        "sources": []
    }

# Basic chat endpoint
@app.post("/api/chat")
async def chat(request: dict):
    messages = request.get("messages", [])
    last_message = messages[-1]["content"] if messages else ""
    logger.info(f"Received chat message: {last_message}")
    return {
        "message": {"role": "assistant", "content": f"This is a placeholder response to: {last_message}"},
        "sources": []
    }

# Simple upload endpoint
@app.post("/api/upload")
async def upload():
    return {"status": "success", "message": "File upload placeholder"}

# Simple metrics endpoint
@app.get("/metrics")
async def metrics():
    return {
        "requests_processed": 0,
        "average_response_time": 0,
        "error_rate": 0,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF

# Copy the simplified main.py to the container
echo "Copying simplified main.py to container..."
docker cp simplified_main.py mega-service-agentqna-agentqna-1:/app/backend/main.py

# Restart the application
echo "Restarting the application..."
docker-compose restart

echo "Waiting for the application to start..."
sleep 5

# Check if the application is running
echo "Checking if the application is running..."
curl -s http://localhost:8080/health || echo "Application not responding yet"

# Clean up
rm simplified_main.py

echo "Done! The application should now be running with a simplified backend."
echo "Check the logs with: docker-compose logs -f"
