from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import sys
import os

# Add parent directory to path so imports work correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Fix the import path
from backend.utils import get_api_logger, get_error_logger

# Get loggers
api_logger = get_api_logger()
error_logger = get_error_logger()

# Define router
router = APIRouter()

# Define message model
class Message(BaseModel):
    role: str
    content: str

# Define request model
class ChatRequest(BaseModel):
    messages: List[Message]

# Define response model
class ChatResponse(BaseModel):
    message: Message
    sources: list = []

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Process a chat conversation and return the next message
    """
    api_logger.info(f"Received chat request with {len(request.messages)} messages")
    try:
        # Placeholder for actual chat processing
        last_message = request.messages[-1].content if request.messages else ""
        response = f"This is a placeholder response to: {last_message}"
        return ChatResponse(
            message=Message(role="assistant", content=response),
            sources=[]
        )
    except Exception as e:
        error_msg = f"Error processing chat: {str(e)}"
        error_logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
