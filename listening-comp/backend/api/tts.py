"""
Text-to-Speech API for Japanese audio synthesis.
"""

import os
import tempfile
from typing import Dict, Optional, List
from pathlib import Path
import base64
import logging
from fastapi import APIRouter, HTTPException, Body, Query, File, UploadFile
from pydantic import BaseModel, Field
from google.cloud import texttospeech
import boto3
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

class TTSRequest(BaseModel):
    """
    Text-to-speech synthesis request.
    """
    text: str = Field(..., description="Japanese text to synthesize")
    voice_gender: str = Field("female", description="Voice gender (male or female)")
    voice_language: str = Field("ja-JP", description="Voice language code")
    service: str = Field("google", description="TTS service to use (google, aws, openai)")
    speed: float = Field(1.0, description="Speech rate (0.5 to 2.0)")
    pitch: float = Field(0.0, description="Voice pitch (-10.0 to 10.0)")

class TTSResponse(BaseModel):
    """
    Text-to-speech synthesis response.
    """
    audio_base64: str = Field(..., description="Base64-encoded audio data")
    content_type: str = Field(..., description="Audio content type")
    text: str = Field(..., description="Original text")
    service: str = Field(..., description="Service used for synthesis")

@router.post("/synthesize", response_model=TTSResponse)
async def synthesize_speech(request: TTSRequest):
    """
    Synthesize Japanese text to speech using the specified service.
    """
    try:
        # Validate speech parameters
        if request.speed < 0.5 or request.speed > 2.0:
            raise HTTPException(status_code=400, detail="Speed must be between 0.5 and 2.0")
            
        if request.pitch < -10.0 or request.pitch > 10.0:
            raise HTTPException(status_code=400, detail="Pitch must be between -10.0 and 10.0")
        
        if not request.text:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Select the appropriate TTS engine based on the request
        if request.service == "google":
            audio_content, content_type = await synthesize_google_tts(
                request.text,
                request.voice_gender,
                request.voice_language,
                request.speed,
                request.pitch
            )
        elif request.service == "aws":
            audio_content, content_type = await synthesize_aws_polly(
                request.text,
                request.voice_gender,
                request.voice_language,
                request.speed
            )
        elif request.service == "openai":
            audio_content, content_type = await synthesize_openai_tts(
                request.text,
                request.voice_gender
            )
        else:
            raise HTTPException(status_code=400, detail="Unsupported TTS service")
        
        # Encode audio content as base64
        audio_base64 = base64.b64encode(audio_content).decode("utf-8")
        
        return TTSResponse(
            audio_base64=audio_base64,
            content_type=content_type,
            text=request.text,
            service=request.service
        )
    
    except Exception as e:
        logger.error(f"Error synthesizing speech: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error synthesizing speech: {str(e)}")

async def synthesize_google_tts(
    text: str,
    voice_gender: str,
    voice_language: str,
    speed: float,
    pitch: float
) -> tuple:
    """
    Synthesize speech using Google Cloud Text-to-Speech.
    """
    try:
        # Initialize the TTS client
        client = texttospeech.TextToSpeechClient()
        
        # Set the input text
        synthesis_input = texttospeech.SynthesisInput(text=text)
        
        # Select voice parameters
        voice_gender_enum = texttospeech.SsmlVoiceGender.FEMALE
        if voice_gender.lower() == "male":
            voice_gender_enum = texttospeech.SsmlVoiceGender.MALE
        
        # Select the voice
        voice = texttospeech.VoiceSelectionParams(
            language_code=voice_language,
            ssml_gender=voice_gender_enum
        )
        
        # Select the audio config
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=speed,
            pitch=pitch
        )
        
        # Perform the TTS request
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        
        return response.audio_content, "audio/mp3"
    
    except Exception as e:
        logger.error(f"Error with Google TTS: {str(e)}")
        raise Exception(f"Error with Google TTS: {str(e)}")

async def synthesize_aws_polly(
    text: str,
    voice_gender: str,
    voice_language: str,
    speed: float
) -> tuple:
    """
    Synthesize speech using AWS Polly.
    """
    try:
        # Initialize the Polly client
        polly_client = boto3.client('polly')
        
        # Select voice ID based on gender and language
        voice_id = "Mizuki"  # Default Japanese female voice
        if voice_gender.lower() == "male":
            voice_id = "Takumi"  # Japanese male voice
        
        # Adjust speech with SSML if needed
        if speed != 1.0:
            ssml_text = f'<speak><prosody rate="{int(speed*100)}%">{text}</prosody></speak>'
            text_type = "ssml"
        else:
            ssml_text = text
            text_type = "text"
        
        # Perform the TTS request
        response = polly_client.synthesize_speech(
            Text=ssml_text,
            TextType=text_type,
            VoiceId=voice_id,
            OutputFormat='mp3'
        )
        
        # Extract audio from the response
        if "AudioStream" in response:
            audio_content = response["AudioStream"].read()
            return audio_content, "audio/mp3"
        else:
            raise Exception("No audio stream in response")
    
    except Exception as e:
        logger.error(f"Error with AWS Polly: {str(e)}")
        raise Exception(f"Error with AWS Polly: {str(e)}")

async def synthesize_openai_tts(
    text: str,
    voice_gender: str
) -> tuple:
    """
    Synthesize speech using OpenAI TTS.
    """
    try:
        # Initialize OpenAI client
        client = OpenAI()
        
        # Select voice
        voice = "nova"  # Default female voice
        if voice_gender.lower() == "male":
            voice = "alloy"
        
        # Create a temporary file for the audio
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
        temp_filename = temp_file.name
        temp_file.close()
        
        # Generate speech
        response = client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text,
        )
        
        # Save audio to the temporary file
        response.stream_to_file(temp_filename)
        
        # Read the file back
        with open(temp_filename, "rb") as audio_file:
            audio_content = audio_file.read()
        
        # Clean up
        os.remove(temp_filename)
        
        return audio_content, "audio/mp3"
    
    except Exception as e:
        logger.error(f"Error with OpenAI TTS: {str(e)}")
        raise Exception(f"Error with OpenAI TTS: {str(e)}")
