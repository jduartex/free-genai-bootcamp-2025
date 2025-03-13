from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/api.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AgentQnA API",
    description="API for the AgentQnA service",
    version="0.1.0"
)

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
    logger.info(f"Request to {request.url} took {process_time:.4f}s")
    return response

# Basic health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Import and include routers
from routes.query import router as query_router
from routes.chat import router as chat_router
from routes.upload import router as upload_router

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
