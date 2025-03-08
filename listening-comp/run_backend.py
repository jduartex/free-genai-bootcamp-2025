import logging
import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse
import uvicorn
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import json

# Import our modules
from question_generator import QuestionGenerator
from tts_service import TTSService
# Add imports for new vector database functionality
from vector_db import VectorDatabase
from japanese_embeddings import JapaneseEmbeddings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI()

# Initialize services
try:
    openai_api_key = os.environ.get("OPENAI_API_KEY", "")
    question_generator = QuestionGenerator(api_key=openai_api_key)
    tts_service = TTSService(provider="gcloud")  # Change to "azure" if needed
    # Add new service initializations
    vector_db = VectorDatabase(db_path="data/japanese_transcripts.db")
    embeddings_service = JapaneseEmbeddings()
except Exception as e:
    logger.error(f"Failed to initialize services: {e}")
    question_generator = None
    tts_service = None
    vector_db = None
    embeddings_service = None

# Define models
class QuestionRequest(BaseModel):
    video_id: str
    jlpt_level: str = "N5"
    num_questions: int = 5

class TTSRequest(BaseModel):
    text: str
    language: str = "ja-JP"

class TranscriptRequest(BaseModel):
    video_id: str
    transcript: str
    timestamp: float = 0.0
    jlpt_level: Optional[str] = "N5"

class SearchRequest(BaseModel):
    query: str
    limit: int = 5

# API Routes
@app.get("/api/transcript")
async def get_transcript(video_id: str):
    """Get transcript for a video"""
    try:
        # In a real implementation, fetch transcript from YouTube API
        # For now, return mock data
        return JSONResponse(content={"transcript": "これは日本語の文章です。", "success": True})
    except Exception as e:
        logger.error(f"Failed to get transcript: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get transcript: {str(e)}")

@app.post("/api/questions/generate")
async def generate_questions(request: QuestionRequest):
    """Generate questions based on transcript and JLPT level"""
    if not question_generator:
        logger.error("Question generator not initialized")
        raise HTTPException(status_code=500, detail="Service initialization failed")
    
    try:
        # Get transcript (in real app, this would be from the video_id)
        # For demo purposes, using a simple transcript
        transcript = "これは日本語の文章です。今日は晴れです。私は日本語を勉強しています。"
        
        # Use vector DB to get the transcript if possible
        if vector_db and vector_db.initialized:
            stored_transcripts = vector_db.get_transcripts_by_video(request.video_id)
            if stored_transcripts:
                # Combine all transcripts for this video
                transcript = " ".join([t["kanji"] for t in stored_transcripts])
        
        logger.info(f"Received question generation request for JLPT level: {request.jlpt_level}")
        logger.info("Generating questions...")
        
        questions = question_generator.generate_questions(
            transcript=transcript,
            level=request.jlpt_level,
            num_questions=request.num_questions
        )
        
        logger.info(f"Successfully generated {len(questions)} questions")
        return JSONResponse(content={"questions": questions, "success": True})
    
    except Exception as e:
        logger.error(f"Failed to generate questions: {str(e)}")
        # Still return some fallback questions
        fallback = question_generator._get_fallback_questions(request.jlpt_level)
        logger.info(f"Using {len(fallback)} fallback questions for level {request.jlpt_level}")
        return JSONResponse(content={"questions": fallback, "success": False, "error": str(e)})

@app.post("/api/tts/synthesize")
async def synthesize_speech(request: TTSRequest):
    """Synthesize speech from text"""
    if not tts_service:
        logger.error("TTS service not initialized")
        raise HTTPException(status_code=500, detail="TTS service initialization failed")
    
    try:
        result = tts_service.synthesize(text=request.text, language=request.language)
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to synthesize speech")
        
        # Check if result is bytes (Google Cloud) or file path (Azure)
        if isinstance(result, bytes):
            return StreamingResponse(iter([result]), media_type="audio/mp3")
        else:  # Assuming it's a file path
            return FileResponse(result, media_type="audio/wav", filename="speech.wav")
    
    except Exception as e:
        logger.error(f"TTS synthesis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")

# Add new routes for vector database functionality
@app.post("/api/transcript/store")
async def store_transcript(request: TranscriptRequest):
    """Store a transcript with its embeddings in the vector database"""
    if not vector_db or not embeddings_service:
        logger.error("Vector database or embeddings service not initialized")
        raise HTTPException(status_code=500, detail="Vector database service not available")
    
    try:
        # Process Japanese text to get kanji, kana, and romaji
        processed_text = embeddings_service.process_japanese_text(request.transcript)
        
        # Generate embedding
        embedding = embeddings_service.get_embeddings(request.transcript)
        
        if embedding is None:
            raise HTTPException(status_code=500, detail="Failed to generate embedding for transcript")
        
        # Store in vector database
        success = vector_db.store_transcript(
            video_id=request.video_id,
            kanji=processed_text["kanji"],
            kana=processed_text["kana"],
            romaji=processed_text["romaji"],
            jlpt_level=request.jlpt_level,
            timestamp=request.timestamp,
            embedding=embedding
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to store transcript in vector database")
        
        return JSONResponse(content={"success": True, "message": "Transcript stored successfully"})
    
    except Exception as e:
        logger.error(f"Failed to store transcript: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to store transcript: {str(e)}")

@app.post("/api/transcript/search")
async def search_transcripts(request: SearchRequest):
    """Search for similar transcripts using vector similarity"""
    if not vector_db or not embeddings_service:
        logger.error("Vector database or embeddings service not initialized")
        raise HTTPException(status_code=500, detail="Vector database service not available")
    
    try:
        # Generate embedding for the query
        query_embedding = embeddings_service.get_embeddings(request.query)
        
        if query_embedding is None:
            raise HTTPException(status_code=500, detail="Failed to generate embedding for query")
        
        # Search for similar transcripts
        results = vector_db.search_similar(query_embedding, limit=request.limit)
        
        return JSONResponse(content={"success": True, "results": results})
    
    except Exception as e:
        logger.error(f"Failed to search transcripts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to search transcripts: {str(e)}")

@app.get("/api/transcripts/{video_id}")
async def get_video_transcripts(video_id: str):
    """Get all transcripts for a video"""
    if not vector_db:
        logger.error("Vector database not initialized")
        raise HTTPException(status_code=500, detail="Vector database service not available")
    
    try:
        # Get transcripts from database
        transcripts = vector_db.get_transcripts_by_video(video_id)
        
        return JSONResponse(content={"success": True, "transcripts": transcripts})
    
    except Exception as e:
        logger.error(f"Failed to get video transcripts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get video transcripts: {str(e)}")

# Run the server
if __name__ == "__main__":
    uvicorn.run("run_backend:app", host="0.0.0.0", port=8000, reload=True)
