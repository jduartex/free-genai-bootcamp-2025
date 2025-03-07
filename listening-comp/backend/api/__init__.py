from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .tts_routes import router as tts_router, init_tts_service, cleanup_tts_service
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Japanese Learning API",
    description="API for Japanese language learning with TTS support",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    logger.info("Initializing TTS service...")
    await init_tts_service()

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup services on shutdown."""
    logger.info("Cleaning up TTS service...")
    await cleanup_tts_service()

# Root endpoint for API health check
@app.get("/")
async def root():
    return {"status": "healthy", "message": "Japanese Learning API is running"}

# Include routers with prefix
app.include_router(tts_router)
