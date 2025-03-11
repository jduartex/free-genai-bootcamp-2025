"""
API routes for Japanese listening transcripts.
"""
import logging
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Path

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Define models
class Transcript(BaseModel):
    id: str
    title: str
    content: str
    translation: Optional[str] = None
    audio_url: Optional[str] = None
    jlpt_level: Optional[str] = None

class TranscriptResponse(BaseModel):
    transcript: Transcript

class TranscriptListResponse(BaseModel):
    transcripts: List[Transcript]

@router.get("/{transcript_id}", response_model=TranscriptResponse)
async def get_transcript(transcript_id: str = Path(..., description="ID of the transcript to retrieve")):
    """
    Get a specific Japanese transcript by ID.
    """
    try:
        logger.info(f"Retrieving transcript with ID: {transcript_id}")
        
        # For now, return a stub implementation with a sample transcript
        # In a real implementation, this would fetch from a database
        
        sample_transcript = Transcript(
            id=transcript_id,
            title="日本語の練習",
            content="これは日本語の練習のためのサンプルテキストです。",
            translation="This is a sample text for practicing Japanese.",
            audio_url=f"/static/audio/transcript_{transcript_id}.mp3",
            jlpt_level="N4"
        )
        
        return TranscriptResponse(transcript=sample_transcript)
        
    except Exception as e:
        logger.error(f"Error retrieving transcript: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving transcript: {str(e)}")

@router.get("/", response_model=TranscriptListResponse)
async def list_transcripts(
    jlpt_level: Optional[str] = None,
    limit: int = 10,
    offset: int = 0
):
    """
    List available Japanese transcripts with optional filtering.
    """
    try:
        logger.info(f"Listing transcripts with filters: jlpt_level={jlpt_level}, limit={limit}, offset={offset}")
        
        # For now, return a stub implementation with sample transcripts
        # In a real implementation, this would fetch from a database
        
        sample_transcripts = [
            Transcript(
                id=f"transcript_{i}",
                title=f"サンプルテキスト {i}",
                content="これは日本語の練習のためのサンプルテキストです。",
                translation="This is a sample text for practicing Japanese.",
                audio_url=f"/static/audio/transcript_{i}.mp3",
                jlpt_level=f"N{(i % 5) + 1}"
            )
            for i in range(offset, offset + limit)
        ]
        
        # Filter by JLPT level if provided
        if jlpt_level:
            sample_transcripts = [t for t in sample_transcripts if t.jlpt_level == jlpt_level]
        
        return TranscriptListResponse(transcripts=sample_transcripts)
        
    except Exception as e:
        logger.error(f"Error listing transcripts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listing transcripts: {str(e)}")
