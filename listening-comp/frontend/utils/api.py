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

async def text_to_speech(text: str, voice_type: str = "female", speaking_style: str = "polite") -> bytes:
    """
    Convert text to speech using the TTS API
    
    Args:
        text: The Japanese text to convert to speech
        voice_type: The type of voice to use (male/female)
        speaking_style: The speaking style (casual/polite)
        
    Returns:
        bytes: Audio data for playback
    """
    api_base_url = st.session_state.get('api_base_url', 'http://localhost:8000')
    
    # Check if TTS service is available before attempting to use it
    if not st.session_state.get('tts_available', True):
        # Only recheck occasionally to avoid constant API calls
        last_check = st.session_state.get('last_tts_check', datetime.min)
        if datetime.now() - last_check < timedelta(minutes=5):
            # Return None if TTS is known to be unavailable and we checked recently
            return None
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{api_base_url}/api/tts/synthesize",
                json={
                    "text": text,
                    "voice_type": voice_type,
                    "speaking_style": speaking_style,
                    "speed": st.session_state.get('speed', 1.0)
                },
                headers={
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg, audio/wav"
                },
                timeout=15.0
            )
            
            if response.status_code == 200:
                st.session_state.tts_available = True
                return response.content
            else:
                if response.status_code == 500:
                    # Try to parse error message
                    try:
                        error_data = response.json()
                        error_msg = error_data.get('detail', str(error_data))
                        if "engine is not supported in this region" in error_msg:
                            st.error("🔇 TTS Error: AWS Polly engine not supported in the configured region")
                        else:
                            st.error(f"🔇 TTS Error: {error_msg}")
                    except:
                        st.error(f"🔇 TTS Error: {response.text}")
                
                # Mark TTS as unavailable
                st.session_state.tts_available = False
                st.session_state.last_tts_check = datetime.now()
                return None
                
    except Exception as e:
        st.error(f"TTS API error: {str(e)}")
        # Mark TTS as potentially unavailable
        st.session_state.tts_available = False
        st.session_state.last_tts_check = datetime.now()
        return None

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
