import aiohttp
import streamlit as st
from typing import Dict, Any, List
import os
from functools import lru_cache

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

async def text_to_speech(text: str) -> bytes:
    """Convert text to speech using backend API"""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{BACKEND_URL}/api/tts",
            json={"text": text},
            stream=True
        ) as response:
            response.raise_for_status()
            return await response.read()

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
