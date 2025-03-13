from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import logging
from services.llm_service import LLMService

router = APIRouter()
logger = logging.getLogger(__name__)

class QueryRequest(BaseModel):
    question: str
    include_sources: bool = False

class QueryResponse(BaseModel):
    answer: str
    sources: list = []

@router.post("/", response_model=QueryResponse)
async def query(request: QueryRequest):
    try:
        logger.info(f"Received query: {request.question}")
        
        # Initialize LLM service
        llm_service = LLMService()
        
        # Get answer from LLM
        result = llm_service.generate_answer(request.question, request.include_sources)
        
        return QueryResponse(
            answer=result["answer"],
            sources=result.get("sources", [])
        )
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")
