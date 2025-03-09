"""
Text-to-Speech API for Japanese audio synthesis using AWS Polly.
"""

import os
import logging
from pathlib import Path
import boto3
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError
import uuid
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Union
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Set up logging
logger = logging.getLogger(__name__)
if logger.handlers:
    logger.handlers = []
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Create router
router = APIRouter()

class TTSResponse(BaseModel):
    status: str = Field("success", description="Status of the request")
    audio_url: str = Field(..., description="URL to access the audio file")

@router.post("/")
async def synthesize_speech(request: Request) -> Union[TTSResponse, Dict[str, Any]]:
    """
    Synthesize Japanese text to speech using AWS Polly - optimized for reliability.
    """
    # Set up output path first so we can return fallback audio if needed
    audio_dir = Path(__file__).parent.parent / "static" / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    
    filename = f"{uuid.uuid4()}.mp3"
    file_path = audio_dir / filename
    
    try:
        # Parse request body - with fallback for invalid JSON
        try:
            request_body = await request.body()
            request_data = json.loads(request_body) if request_body else {}
        except json.JSONDecodeError:
            logger.warning("Invalid JSON request")
            request_data = {}
        
        # Extract text with fallback
        text = request_data.get("text")
        if not text:
            logger.warning("No text provided in request")
            create_minimum_audio_file(file_path)
            return {"status": "error", "message": "No text provided", "audio_url": f"/static/audio/{filename}"}
        
        # Log request (truncated for long text)
        text_preview = text[:30] + ("..." if len(text) > 30 else "")
        logger.info(f"TTS request: '{text_preview}'")
        
        # Extract voice parameter - support both voice_id and voice_type
        voice_id = request_data.get("voice_id")
        if not voice_id and "voice_type" in request_data:
            # Map frontend voice_type to Polly voice_id
            voice_map = {
                "female": "Mizuki",
                "male": "Takumi",
            }
            voice_id = voice_map.get(request_data.get("voice_type", "").lower(), "Mizuki")
        
        # Default to Mizuki if no valid voice specified
        if not voice_id:
            voice_id = "Mizuki"
            
        # Set up AWS Polly client with error handling
        try:
            region = os.environ.get("AWS_REGION", "us-east-1")
            polly_client = boto3.client('polly', region_name=region)
        except Exception as e:
            logger.exception(f"Failed to initialize AWS client: {e}")
            create_minimum_audio_file(file_path)
            return TTSResponse(status="error", audio_url=f"/static/audio/{filename}")
        
        # Prepare SSML if speed is specified - with error handling
        text_type = "text"
        final_text = text
        try:
            speed = request_data.get("speed")
            if speed is not None:
                speed_float = float(speed)
                if speed_float != 1.0:
                    # Ensure speed is within valid range
                    speed_float = max(0.5, min(2.0, speed_float))
                    final_text = f'<speak><prosody rate="{speed_float}">{text}</prosody></speak>'
                    text_type = "ssml"
        except (ValueError, TypeError):
            # Invalid speed value, just use plain text
            pass
                
        # Always use standard engine - it works in all regions
        engine = "standard"
        
        try:
            # Call Polly to synthesize speech
            logger.debug(f"Calling Polly: voice={voice_id}, engine={engine}, text_type={text_type}")
            
            try:
                response = polly_client.synthesize_speech(
                    Text=final_text,
                    TextType=text_type,
                    OutputFormat='mp3',
                    VoiceId=voice_id,
                    Engine=engine,
                    LanguageCode='ja-JP'
                )
            except ClientError as e:
                # If the voice is not found, try with Mizuki
                if "VoiceId not found" in str(e) or "not find voice" in str(e).lower():
                    logger.warning(f"Voice {voice_id} not found, falling back to Mizuki")
                    response = polly_client.synthesize_speech(
                        Text=final_text if text_type == "ssml" else text,
                        TextType=text_type,
                        OutputFormat='mp3',
                        VoiceId="Mizuki",  # Fallback to most reliable voice
                        Engine=engine,
                        LanguageCode='ja-JP'
                    )
                else:
                    # For other errors, try with basic parameters
                    logger.warning(f"Error with complex parameters: {e}. Trying simplest parameters.")
                    response = polly_client.synthesize_speech(
                        Text=text,  # Plain text, no SSML
                        TextType="text",
                        OutputFormat='mp3',
                        VoiceId="Mizuki",
                        Engine="standard",
                        LanguageCode='ja-JP'
                    )
            
            # Get and save audio content
            audio_content = response['AudioStream'].read()
            with open(file_path, 'wb') as f:
                f.write(audio_content)
                
            # Return success response with audio URL
            audio_url = f"/static/audio/{filename}"
            logger.info(f"Successfully generated audio: {audio_url}")
            
            return TTSResponse(
                status="success",
                audio_url=audio_url
            )
            
        except Exception as error:
            error_msg = str(error)
            logger.exception(f"Polly synthesis error: {error_msg}")
            
            # Create fallback audio
            create_minimum_audio_file(file_path)
            return TTSResponse(
                status="error",
                audio_url=f"/static/audio/{filename}"
            )
                
    except Exception as e:
        logger.exception(f"Unexpected error in TTS endpoint: {e}")
        
        # Create fallback audio file
        create_minimum_audio_file(file_path)
        
        # Return the minimal audio
        return TTSResponse(
            status="error",
            audio_url=f"/static/audio/{filename}"
        )

def create_minimum_audio_file(filepath: Path) -> bool:
    """Create a minimum valid MP3 file"""
    try:
        # This is a minimal valid MP3 file
        mp3_header = bytes([
            0xFF, 0xFB, 0x90, 0x44, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ])
        
        # Write enough data for a short audio file
        with open(filepath, 'wb') as f:
            f.write(mp3_header * 100)
            
        return True
    except Exception as e:
        logger.error(f"Failed to create minimal audio file: {e}")
        return False

@router.get("/voices")
async def get_voices():
    """
    Get available voices for TTS.
    """
    try:
        region = os.environ.get("AWS_REGION", "us-east-1")
        polly_client = boto3.client('polly', region_name=region)
        
        # Get available voices
        response = polly_client.describe_voices(LanguageCode='ja-JP')
        
        # Extract voice information - only include standard engine
        voices = []
        for voice in response.get('Voices', []):
            voices.append({
                'id': voice.get('Id'),
                'name': voice.get('Name'),
                'gender': voice.get('Gender'),
                'engines': ["standard"]  # Only include standard engine as it's guaranteed to work
            })
        
        logger.info(f"Found {len(voices)} Japanese voices")
        return {"voices": voices}
    except Exception as e:
        logger.exception(f"Error getting voices: {e}")
        return {"voices": [{"id": "Mizuki", "name": "Mizuki (Fallback)", "gender": "Female", "engines": ["standard"]}]}

@router.get("/status")
async def tts_status():
    """
    Check TTS service status.
    """
    try:
        region = os.environ.get("AWS_REGION", "us-east-1")
        polly_client = boto3.client('polly', region_name=region)
        
        # Try minimal synthesis test
        response = polly_client.synthesize_speech(
            Text="テスト",
            OutputFormat='mp3',
            VoiceId="Mizuki",
            Engine="standard",
            LanguageCode='ja-JP'
        )
        
        # Verify we got audio content
        audio_size = len(response['AudioStream'].read())
        
        return {
            "status": "ok",
            "message": "TTS service is operational",
            "details": {
                "region": region,
                "test_audio_size": audio_size
            }
        }
    except Exception as e:
        logger.exception(f"TTS status check failed: {e}")
        return {
            "status": "error",
            "message": str(e)
        }
