"""
Main FastAPI application for the Japanese Listening Comprehension backend.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
from datetime import datetime
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("japanese-listening-app")

# Import API initialization
from api import init_api

# Create the FastAPI application
app = FastAPI(
    title="Japanese Listening Comprehension API",
    description="API for generating and managing Japanese listening comprehension exercises",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create static directory for audio files if it doesn't exist
static_dir = Path(__file__).parent / "static"
audio_dir = static_dir / "audio"
os.makedirs(audio_dir, exist_ok=True)

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize API routes
init_api(app)

# Root endpoint is directly on the app
@app.get("/")
async def root():
    """
    Root endpoint with API information.
    """
    return {
        "message": "Welcome to the Japanese Listening Comprehension API",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
    }

# Add startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    logger.info("Initializing API services...")
    # No need to call a specific TTS service initialization here

# Add shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup services on shutdown."""
    logger.info("Cleaning up API services...")
    # No specific cleanup required for TTS service
