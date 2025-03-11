"""
API utilities for making robust requests to the backend.
"""
import os
import asyncio
import logging
import requests
import streamlit as st
from typing import Dict, Any, Optional, Union
import base64
from pathlib import Path
import time

# Configure logging
logger = logging.getLogger(__name__)

# Default API base URL
DEFAULT_API_URL = "http://localhost:8000"

def get_api_base_url() -> str:
    """Get the API base URL from environment or session state."""
    # Check environment first
    api_url = os.environ.get("API_URL")
    
    # Then check session state (UI configuration)
    if not api_url and hasattr(st, "session_state") and "api_base_url" in st.session_state:
        api_url = st.session_state.api_base_url
    
    # Fall back to default
    return api_url or DEFAULT_API_URL

async def text_to_speech(text: str, voice_id: str = "Mizuki") -> Optional[bytes]:
    """
    Generate speech from text using the TTS API.
    Handles errors gracefully and provides fallbacks.
    
    Args:
        text: The Japanese text to convert to speech
        voice_id: Voice ID or type to use
    
    Returns:
        Audio content as bytes or None if failed
    """
    if not text:
        logger.warning("Empty text provided to TTS")
        return None
    
    api_base_url = get_api_base_url()
    endpoint = f"{api_base_url}/api/tts"
    
    try:
        logger.info(f"Calling TTS API with text: {text[:30]}...")
        
        # Make API request
        response = requests.post(
            endpoint,
            json={
                "text": text,
                "voice_id": voice_id,
                "engine": "standard"  # Always use standard for reliability
            },
            timeout=10
        )
        
        # Check for success
        if response.status_code == 200:
            logger.info("TTS request successful")
            response_data = response.json()
            audio_url = response_data.get("audio_url")
            
            if audio_url:
                # Get the full audio URL
                full_audio_url = f"{api_base_url}{audio_url}"
                
                # Get the audio content
                audio_response = requests.get(full_audio_url, timeout=5)
                if audio_response.status_code == 200:
                    return audio_response.content
        
        # Log error details
        logger.error(f"TTS API error: status={response.status_code}")
        try:
            error_details = response.json()
            logger.error(f"Error details: {error_details}")
        except:
            logger.error(f"Response text: {response.text}")
        
        return None
        
    except requests.RequestException as e:
        logger.exception(f"TTS request failed: {e}")
        return None
    except Exception as e:
        logger.exception(f"Unexpected error in text_to_speech: {e}")
        return None

async def get_voices() -> list:
    """Get available TTS voices."""
    api_base_url = get_api_base_url()
    endpoint = f"{api_base_url}/api/tts/voices"
    
    try:
        response = requests.get(endpoint, timeout=5)
        if response.status_code == 200:
            data = response.json()
            return data.get("voices", [])
    except Exception as e:
        logger.exception(f"Error getting voices: {e}")
    
    # Return default voices if API call fails
    return [
        {"id": "Mizuki", "name": "Mizuki (Female)", "gender": "Female"},
        {"id": "Takumi", "name": "Takumi (Male)", "gender": "Male"}
    ]

async def check_tts_status() -> Dict[str, Any]:
    """Check TTS service status."""
    api_base_url = get_api_base_url()
    endpoint = f"{api_base_url}/api/tts/status"
    
    try:
        response = requests.get(endpoint, timeout=5)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        logger.exception(f"Error checking TTS status: {e}")
    
    return {"status": "unknown", "message": "Could not connect to TTS service"}

import aiohttp
import streamlit as st
from typing import Dict, Any, List
import os
from functools import lru_cache
from datetime import datetime, timedelta
import httpx

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

@st.cache_data(ttl=3600)  # Cache for 1 hour
async def fetch_transcript(youtube_url: str) -> Dict[str, Any]:
    """Fetch and cache transcript from backend API"""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{BACKEND_URL}/api/transcript",
            json={"url": youtube_url}
        ) as response:
            response.raise_for_status()
            return await response.json()

@st.cache_data(ttl=3600)
async def generate_questions(transcript: str, jlpt_level: str = "N5") -> Dict[str, Any]:
    """Generate and cache questions from transcript"""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{BACKEND_URL}/api/questions",
            json={
                "transcript": transcript,
                "jlpt_level": jlpt_level
            }
        ) as response:
            response.raise_for_status()
            return await response.json()

async def speech_to_text(audio_file) -> Dict[str, Any]:
    """Convert speech to text using backend API"""
    # Create a FormData object for proper file upload
    form_data = aiohttp.FormData()
    form_data.add_field('audio', audio_file.read(), 
                       filename=getattr(audio_file, 'name', 'audio.wav'),
                       content_type='audio/wav')
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{BACKEND_URL}/api/asr",
            data=form_data
        ) as response:
            response.raise_for_status()
            return await response.json()

async def analyze_pronunciation(audio_file, expected_text: str) -> Dict[str, Any]:
    """Analyze pronunciation accuracy from audio compared to expected text"""
    form_data = aiohttp.FormData()
    form_data.add_field('audio', audio_file.read(), 
                       filename=getattr(audio_file, 'name', 'audio.wav'),
                       content_type='audio/wav')
    form_data.add_field('expected_text', expected_text)
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{BACKEND_URL}/api/pronunciation",
            data=form_data
        ) as response:
            response.raise_for_status()
            return await response.json()

if __name__ == "__main__":
    print("This file contains API utility functions and is not meant to be run directly.")
    print("These functions should be imported into other modules, e.g.:")
    print("    from utils.api import text_to_speech, fetch_transcript")
    print("\nAvailable functions:")
    print("- fetch_transcript(youtube_url): Fetch transcript from YouTube URL")
    print("- generate_questions(transcript, jlpt_level): Generate questions from transcript")
    print("- text_to_speech(text): Convert text to speech")
    print("- speech_to_text(audio_file): Convert speech to text")
    print("- analyze_pronunciation(audio_file, expected_text): Analyze pronunciation accuracy")
