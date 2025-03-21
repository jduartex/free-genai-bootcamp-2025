#!/bin/bash

echo "Stopping container..."
docker-compose down

echo "Creating backup of current files..."
if [ -f "backend/main.py" ]; then
    cp backend/main.py backend/main.py.bak
fi

echo "Updating main.py with correct imports..."
cat << 'EOF' > backend/main.py
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import our logging configuration
from backend.utils import get_api_logger, get_error_logger, get_performance_logger

# Initialize FastAPI app
app = FastAPI(
    title="AgentQnA API",
    description="API for the AgentQnA service",
    version="0.1.0"
)

# Use our configured loggers
api_logger = get_api_logger()
error_logger = get_error_logger()
perf_logger = get_performance_logger()

api_logger.info("Starting backend API server")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set to specific origins in production
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
    perf_logger.info(f"Request to {request.url} took {process_time:.4f}s")
    return response

# Basic health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Import and include routers - Fixed import paths
from backend.routes.query import router as query_router
from backend.routes.chat import router as chat_router
from backend.routes.upload import router as upload_router

app.include_router(query_router, prefix="/api/query", tags=["query"])
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(upload_router, prefix="/api/upload", tags=["upload"])

# Simple metrics endpoint
@app.get("/metrics")
async def metrics():
    # In a real implementation, collect metrics from the application
    return {
        "requests_processed": 0,
        "average_response_time": 0,
        "error_rate": 0,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF

echo "Rebuilding and restarting container..."
docker-compose build
docker-compose up -d

echo "Creating log directories in the container..."
docker-compose exec agentqna mkdir -p /app/logs
docker-compose exec agentqna mkdir -p /app/backend/logs
docker-compose exec agentqna chmod -R 777 /app/logs
docker-compose exec agentqna chmod -R 777 /app/backend/logs

echo "Done! Check logs to see if the application started correctly:"
echo "docker-compose logs -f"
