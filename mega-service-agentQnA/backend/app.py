import os
from fastapi import FastAPI
from backend.middleware.api_logger import APILoggerMiddleware
from backend.utils import get_agent_logger

# Create FastAPI app
app = FastAPI(title="AgentQnA API")

# Add API logger middleware if logging is enabled
if os.environ.get("ENABLE_LOGGING", "false").lower() == "true":
    app.add_middleware(APILoggerMiddleware)
    
    # Get the agent logger and log application startup
    logger = get_agent_logger()
    logger.info("AgentQnA application starting up")

# ...existing code...