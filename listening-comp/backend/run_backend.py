import os
import uvicorn
from fastapi import FastAPI, HTTPException, Query, File, UploadFile, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv
import re
import logging

# Load environment variables from .env file
load_dotenv()

# Import our service modules
from transcript_fetcher import YouTubeTranscriptFetcher
from vector_db import VectorDatabase
from question_generator import QuestionGenerator
from tts_service import TTSService
from speech_recognition import SpeechRecognizer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Japanese Listening Comprehension Backend API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # During development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
transcript_fetcher = YouTubeTranscriptFetcher()
vector_db = VectorDatabase()
question_generator = QuestionGenerator()
tts_service = TTSService()
speech_recognizer = SpeechRecognizer()

# Define API models
class TranscriptRequest(BaseModel):
    video_id: str
    language: str = "ja"  # Default to Japanese

class TranscriptAnalysisRequest(BaseModel):
    transcript: str
    metadata: Optional[Dict[str, Any]] = None

class QuestionGenerationRequest(BaseModel):
    transcript: str
    jlpt_level: str = "N4"  # Default to intermediate level
    num_questions: int = 5
    include_answers: bool = True

class TTSRequest(BaseModel):
    text: str
    voice_id: str = "Mizuki"  # Default to a Japanese female voice
    engine: str = "neural"
    
class ASRRequest(BaseModel):
    file_path: str

# API endpoints
@app.get("/")
def read_root():
    return {"status": "active", "service": "Japanese Listening Comprehension Backend"}

def extract_video_id(url_or_id: str) -> str:
    """Extract video ID from URL or return as-is if already an ID"""
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'youtu.be\/([0-9A-Za-z_-]{11})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url_or_id)
        if match:
            return match.group(1)
    return url_or_id

# Transcript Service
@app.get("/api/transcript")
async def get_transcript(
    video_id: str = Query(..., description="YouTube video ID or URL"),
    language: str = Query("ja", description="Language code")
):
    """Fetch transcript for a YouTube video"""
    try:
        # Extract video ID if a full URL was provided
        clean_video_id = extract_video_id(video_id)
        transcript = await transcript_fetcher.fetch_transcript(clean_video_id)
        return {"status": "success", "transcript": transcript}
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Transcript not found: {str(e)}")

@app.post("/api/transcript/analyze")
async def analyze_transcript(request: TranscriptAnalysisRequest):
    """Process and analyze transcript content"""
    try:
        analysis = await vector_db.analyze_transcript(request.transcript, request.metadata)
        return {"status": "success", "analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# Question Generation
@app.post("/api/questions/generate")
async def generate_questions(request: QuestionGenerationRequest):
    """Generate questions based on transcript"""
    try:
        logger.info(f"Received question generation request for JLPT level: {request.jlpt_level}")
        
        if not request.transcript or not isinstance(request.transcript, str):
            logger.error(f"Invalid transcript format: {type(request.transcript)}")
            raise HTTPException(
                status_code=422,
                detail="Invalid transcript format. Expected a string."
            )
            
        if request.jlpt_level not in ["N1", "N2", "N3", "N4", "N5"]:
            logger.error(f"Invalid JLPT level: {request.jlpt_level}")
            raise HTTPException(
                status_code=422,
                detail="Invalid JLPT level. Must be one of: N1, N2, N3, N4, N5"
            )
        
        # Clean the transcript text
        transcript_text = request.transcript.strip()
        if not transcript_text:
            logger.error("Empty transcript received")
            raise HTTPException(
                status_code=422,
                detail="Empty transcript"
            )
        
        logger.info("Generating questions...")
        questions = await question_generator.generate(
            transcript=transcript_text,
            jlpt_level=request.jlpt_level,
            num_questions=request.num_questions,
            include_answers=request.include_answers
        )
        
        if not questions:
            logger.warning("No questions generated, using fallback questions")
        else:
            logger.info(f"Successfully generated {len(questions)} questions")
            
        return {
            "status": "success",
            "questions": questions,
            "source": "fallback" if not questions else "api"
        }
        
    except Exception as e:
        logger.error(f"Question generation error: {str(e)}", exc_info=True)
        # Return fallback questions instead of error
        fallback_questions = question_generator._get_fallback_questions(
            request.jlpt_level, 
            request.num_questions
        )
        return {
            "status": "success",
            "questions": fallback_questions,
            "source": "fallback"
        }

@app.get("/api/questions")
async def get_questions(jlpt_level: str = Query("N4", description="JLPT level (N1-N5)")):
    """Get questions filtered by JLPT level"""
    try:
        questions = await question_generator.get_by_jlpt_level(jlpt_level)
        return {"status": "success", "questions": questions}
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Questions not found: {str(e)}")

# Text-to-Speech
@app.post("/api/tts")
async def text_to_speech(request: TTSRequest):
    """Convert text to speech audio"""
    try:
        audio_file = await tts_service.synthesize(request.text, request.voice_id, request.engine)
        return {"status": "success", "audio_file": audio_file}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")

@app.get("/api/voices")
async def get_voices():
    """Get available Japanese voice options"""
    try:
        voices = await tts_service.list_voices()
        return {"status": "success", "voices": voices}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve voices: {str(e)}")

# Speech Recognition
@app.post("/api/asr")
async def speech_recognition(file: UploadFile = File(...)):
    """Process speech audio and return recognized text"""
    try:
        # Save uploaded file temporarily
        temp_file_path = f"temp_{file.filename}"
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Process with speech recognizer
        transcription = await speech_recognizer.transcribe(temp_file_path)
        
        # Remove temporary file
        os.remove(temp_file_path)
        
        return {"status": "success", "transcription": transcription}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech recognition failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("run_backend:app", host="0.0.0.0", port=8000, reload=True)
