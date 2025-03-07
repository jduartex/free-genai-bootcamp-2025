from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field, validator
from enum import Enum
from typing import Optional
import io
import logging
from services.tts_service import (
    JapaneseTTSService,
    VoiceGender,
    SpeakingStyle,
    RegionalAccent,
    TTSProvider
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize TTS service at module level
tts_service = None

# Change router to include prefix
router = APIRouter(prefix="/api/tts")

class VoiceType(str, Enum):
    MALE = "male"
    FEMALE = "female"

class SpeechStyle(str, Enum):
    POLITE = "polite"
    CASUAL = "casual"
    FORMAL = "formal"
    HUMBLE = "humble"
    RESPECTFUL = "respectful"

class RegionalAccentType(str, Enum):
    STANDARD = "standard"
    KANSAI = "kansai"
    TOHOKU = "tohoku"
    KYUSHU = "kyushu"

class TTSRequest(BaseModel):
    text: str = Field(..., description="Japanese text to synthesize")
    voice_type: VoiceType = Field(default=VoiceType.FEMALE)
    speaking_style: SpeechStyle = Field(default=SpeechStyle.POLITE)
    regional_accent: RegionalAccentType = Field(default=RegionalAccentType.STANDARD)
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    pitch: float = Field(default=0.0, ge=-10.0, le=10.0)
    volume: float = Field(default=0.0, ge=-6.0, le=6.0)
    jlpt_level: Optional[str] = Field(default=None, regex="^N[1-5]$")

    @validator('text')
    def text_must_contain_japanese(cls, v):
        # Simple check for Japanese characters
        if not any('\u3040' <= c <= '\u30ff' or '\u4e00' <= c <= '\u9fff' for c in v):
            raise ValueError('Text must contain Japanese characters')
        return v

async def init_tts_service():
    """Initialize TTS service."""
    global tts_service
    try:
        tts_service = JapaneseTTSService()
        logger.info("TTS service initialized successfully")
        return tts_service
    except Exception as e:
        logger.error(f"Failed to initialize TTS service: {e}")
        raise

async def cleanup_tts_service():
    """Cleanup TTS service resources."""
    global tts_service
    if tts_service:
        # Add any cleanup needed
        tts_service = None
        logger.info("TTS service cleaned up")

def generate_audio_stream(audio_content: bytes):
    """Generate audio stream from bytes."""
    return io.BytesIO(audio_content)

@router.post("/synthesize")  # Changed from "/api/tts/synthesize"
async def synthesize_speech(request: TTSRequest, background_tasks: BackgroundTasks):
    """
    Synthesize Japanese speech from text with specified parameters.
    Returns audio file in MP3 format as a streaming response.
    """
    global tts_service
    
    try:
        if not tts_service:
            await init_tts_service()
        
        logger.info(f"Processing TTS request for text: {request.text[:30]}...")
        
        # Map request parameters
        gender = VoiceGender.FEMALE if request.voice_type == VoiceType.FEMALE else VoiceGender.MALE
        style = getattr(SpeakingStyle, request.speaking_style.upper())
        accent = getattr(RegionalAccent, request.regional_accent.upper())
        
        # Optimize for learner level if specified
        if request.jlpt_level:
            modified_text, speaking_rate, params = tts_service.optimize_for_learner_level(
                request.text,
                request.jlpt_level,
                style
            )
            speed = speaking_rate
        else:
            modified_text = request.text
            speed = request.speed
            params = {}
        
        # Synthesize speech
        file_path, audio_content = tts_service.synthesize_speech(
            text=modified_text,
            speaking_rate=speed,
            pitch=request.pitch,
            volume=request.volume,
            accent=accent,
            speaking_style=style,
            emphasize_pitch_accent=request.jlpt_level in ['N5', 'N4']
        )
        
        if not audio_content:
            raise HTTPException(status_code=500, detail="Failed to generate audio content")
        
        # Create streaming response
        stream = generate_audio_stream(audio_content)
        
        # Add cleanup to background tasks
        background_tasks.add_task(cleanup_tts_service)
        
        # Return streaming response
        return StreamingResponse(
            stream,
            media_type="audio/mp3",
            headers={
                "Content-Disposition": f'attachment; filename="speech_{request.jlpt_level or "standard"}.mp3"'
            }
        )
        
    except Exception as e:
        logger.error(f"TTS synthesis failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "TTS synthesis failed",
                "message": str(e),
                "text": request.text[:100] + "..." if len(request.text) > 100 else request.text
            }
        )

@router.get("/voices")  # Changed from "/api/tts/voices"
async def list_voices():
    """Get available Japanese voice options."""
    global tts_service
    
    try:
        if not tts_service:
            await init_tts_service()
            
        voices = tts_service.get_available_voices()
        return JSONResponse({
            "voices": voices,
            "speaking_styles": [style.value for style in SpeechStyle],
            "regional_accents": [accent.value for accent in RegionalAccentType]
        })
    except Exception as e:
        logger.error(f"Failed to list voices: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
