from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import logging
import sys
import os

# Add parent directory to path so imports work correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Fix the import path
from backend.utils import get_api_logger, get_error_logger
from backend.services.llm_service import LLMService

# Get loggers
api_logger = get_api_logger()
error_logger = get_error_logger()

router = APIRouter()

class QueryRequest(BaseModel):
    query: str
    include_sources: bool = True

class Source(BaseModel):
    title: str = ""
    excerpt: str = ""

class QueryResponse(BaseModel):
    answer: str
    sources: List[Source] = []

@router.post("/", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    """
    Process a query and return an answer with sources
    """
    api_logger.info(f"Received query: {request.query}")
    try:
        # Initialize LLM service
        llm_service = LLMService()
        
        # Get answer from LLM
        result = llm_service.generate_answer(request.query, request.include_sources)
        
        return QueryResponse(
            answer=result["answer"],
            sources=result.get("sources", [])
        )
    except Exception as e:
        error_msg = f"Error processing query: {str(e)}"
        error_logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
