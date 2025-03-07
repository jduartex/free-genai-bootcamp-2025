from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
import tempfile
import os
import logging
from ..utils.asr import transcribe_audio
from ..utils.pronunciation import analyze_pronunciation_accuracy

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/api/asr", response_model=Dict[str, Any])
async def speech_to_text(audio: UploadFile = File(...)):
    """
    Process speech from audio file and return transcribed text
    """
    try:
        # Save the uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            content = await audio.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        # Process the audio file
        result = transcribe_audio(temp_path)
        
        # Clean up
        os.unlink(temp_path)
        
        return {
            "success": True,
            "text": result["text"],
            "confidence": result.get("confidence", 0.0)
        }
    
    except Exception as e:
        logger.error(f"Error in speech_to_text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/pronunciation", response_model=Dict[str, Any])
async def check_pronunciation(
    audio: UploadFile = File(...),
    expected_text: str = Form(...)
):
    """
    Analyze pronunciation accuracy by comparing speech to expected text
    """
    try:
        # Save the uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            content = await audio.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        # Process the audio and analyze pronunciation
        result = analyze_pronunciation_accuracy(temp_path, expected_text)
        
        # Clean up
        os.unlink(temp_path)
        
        return {
            "success": True,
            "accuracy": result["overall_accuracy"],
            "transcribed_text": result["transcribed_text"],
            "phoneme_scores": result.get("phoneme_scores", {}),
            "feedback": result.get("feedback", [])
        }
    
    except Exception as e:
        logger.error(f"Error in check_pronunciation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
