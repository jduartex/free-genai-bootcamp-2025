from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import time
import os
import logging
import sys
import json

# Configure basic logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("agentqna")
logger.info("Starting AgentQnA backend server")

# Initialize FastAPI app
app = FastAPI(
    title="AgentQnA API",
    description="API for the AgentQnA service",
    version="0.1.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request and Response models
class QueryRequest(BaseModel):
    query: str
    include_sources: bool = True

class Source(BaseModel):
    title: str
    excerpt: str

class QueryResponse(BaseModel):
    answer: str
    sources: list[Source] = []

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

# Basic query endpoint with predefined answers for demo
@app.post("/api/query")
async def process_query(request: QueryRequest):
    logger.info(f"Received query: {request.query}")
    
    try:
        # Simplified answer generation based on keywords in the query
        query_lower = request.query.lower()
        
        if "feature" in query_lower and "agentqna" in query_lower:
            answer = "The main feature of AgentQnA is its multi-agent system that combines Retrieval Augmented Generation (RAG) with specialized worker agents to provide accurate answers based on your document knowledge base."
            sources = [
                Source(title="AgentQnA Documentation", excerpt="Multi-Agent System: Supervisor and worker agents collaborate to answer complex questions"),
                Source(title="RAG Architecture Guide", excerpt="Retrieval Augmented Generation (RAG): Enhances LLM responses with context from your documents")
            ] if request.include_sources else []
        elif "document" in query_lower or "upload" in query_lower:
            answer = "AgentQnA allows you to upload PDF documents which are processed into a vector database for semantic retrieval, enabling the system to answer questions based on your specific knowledge base."
            sources = [
                Source(title="Document Processing Guide", excerpt="Document Ingestion: Upload and process PDF documents for domain-specific knowledge")
            ] if request.include_sources else []
        else:
            answer = "AgentQnA is a question answering service that leverages multiple AI agents, vector databases, and knowledge graphs to provide accurate answers to your queries based on your document knowledge base."
            sources = []
            
        logger.info("Answer generated successfully")
        return QueryResponse(answer=answer, sources=sources)
    
    except Exception as e:
        error_msg = f"Error processing query: {str(e)}"
        logger.error(error_msg)
        logger.exception("Detailed exception information:")
        return JSONResponse(
            status_code=500, 
            content={"detail": "An error occurred while processing your request"}
        )

# Define message model
class Message(BaseModel):
    role: str
    content: str

# Define request model
class ChatRequest(BaseModel):
    messages: list[Message]

# Define response model
class ChatResponse(BaseModel):
    message: Message
    sources: list = []

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    Process a chat conversation and return the next message
    """
    logger.info(f"Received chat request with {len(request.messages)} messages")
    try:
        # Get the last user message
        last_message = request.messages[-1].content if request.messages else ""
        last_message_lower = last_message.lower()
        
        # Generate contextual responses based on message content
        if "document" in last_message_lower and ("ingestion" in last_message_lower or "upload" in last_message_lower):
            response = (
                "AgentQnA's document ingestion process works as follows:\n\n"
                "1. You upload PDF documents through the UI or API\n"
                "2. The system extracts text content using OCR if needed\n"
                "3. Documents are chunked into semantic segments\n"
                "4. Each segment is converted to vector embeddings\n"
                "5. Embeddings are stored in the vector database (ChromaDB)\n"
                "6. Documents become searchable by semantic meaning\n\n"
                "This allows the system to retrieve relevant context when answering questions."
            )
        elif "agent" in last_message_lower or "multi-agent" in last_message_lower:
            response = (
                "AgentQnA uses a multi-agent architecture where:\n\n"
                "1. A supervisor agent coordinates the overall process\n"
                "2. Specialized worker agents perform specific tasks\n"
                "3. Agents collaborate to answer complex questions\n"
                "4. Each agent has access to different tools and knowledge\n\n"
                "This approach provides more accurate answers by combining different expertise."
            )
        elif "rag" in last_message_lower or "retrieval" in last_message_lower:
            response = (
                "Retrieval Augmented Generation (RAG) is a core technology in AgentQnA that:\n\n"
                "1. Retrieves relevant context from your documents\n"
                "2. Provides this context to the language model\n"
                "3. Generates answers grounded in your specific knowledge\n"
                "4. Reduces hallucinations and improves accuracy\n\n"
                "This allows for precise answers based on your organization's documents."
            )
        else:
            response = (
                f"I'd be happy to help with information about '{last_message}'. "
                "AgentQnA specializes in retrieving information from your documents. "
                "You can ask about document ingestion, the multi-agent system, RAG architecture, or how to use specific features."
            )
            
        logger.info("Chat response generated successfully")
        return ChatResponse(
            message=Message(role="assistant", content=response),
            sources=[]
        )
    except Exception as e:
        error_msg = f"Error processing chat: {str(e)}"
        logger.error(error_msg)
        logger.exception("Detailed exception information:")
        return JSONResponse(
            status_code=500, 
            content={"detail": "An error occurred while processing your chat request"}
        )

# Simple upload endpoint
@app.post("/api/upload")
async def upload():
    return {"status": "success", "message": "File upload placeholder"}

# Simple metrics endpoint
@app.get("/metrics")
async def metrics():
    return {
        "requests_processed": 0,
        "average_response_time": 0,
        "error_rate": 0,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
