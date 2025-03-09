"""
Main entry point for the FastAPI backend server.
"""

import uvicorn
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("backend")

if __name__ == "__main__":
    # Get port from environment or use default
    port = int(os.getenv("BACKEND_PORT", 8000))
    
    # Log startup information
    logger.info(f"Starting backend server on port {port}")
    logger.info(f"API documentation available at http://localhost:{port}/docs")
    
    # Run the FastAPI application with uvicorn
    uvicorn.run(
        "app:app",  # Referring to app.py:app
        host="0.0.0.0",
        port=port,
        reload=True  # Enable auto-reload for development
    )
