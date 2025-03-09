"""
API package for the Japanese Listening Comprehension backend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import routers
from .tts import router as tts_router
from .questions import router as questions_router
from .transcripts import router as transcripts_router

# Function to initialize the API - keep only this function, remove the separate app instance
def init_api(app: FastAPI):
    """
    Initialize API routes and middleware.
    """
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include routers
    app.include_router(tts_router, prefix="/api/tts", tags=["tts"])
    app.include_router(questions_router, prefix="/api/questions", tags=["questions"])
    app.include_router(transcripts_router, prefix="/api/transcripts", tags=["transcripts"])
    
    # Add health check endpoint
    @app.get("/api/health")
    async def health_check():
        """
        Health check endpoint to verify API is running.
        """
        from datetime import datetime
        return {
            "status": "ok",
            "timestamp": datetime.now().isoformat(),
            "version": app.version,
        }
    
    logger.info("API routes initialized")
