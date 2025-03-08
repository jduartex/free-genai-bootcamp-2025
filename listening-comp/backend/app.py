"""
Main FastAPI application for the Japanese Listening Comprehension backend.
"""

import os
from fastapi import FastAPI, HTTPException, Body, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging
import json
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("japanese-listening-app")

# Import routers and services
from api.questions import router as questions_router
from api.tts import router as tts_router
from api.transcripts import router as transcripts_router

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

# Include routers
app.include_router(questions_router, prefix="/api/questions", tags=["questions"])
app.include_router(tts_router, prefix="/api/tts", tags=["tts"])
app.include_router(transcripts_router, prefix="/api/transcripts", tags=["transcripts"])

@app.get("/api/health")
async def health_check():
    """
    Health check endpoint to verify API is running.
    """
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "version": app.version,
        "services": {
            "questions": "available",
            "tts": "available",
            "transcripts": "available"
        }
    }

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
