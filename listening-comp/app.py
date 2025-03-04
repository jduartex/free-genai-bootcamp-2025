import streamlit as st
import aiohttp
import asyncio
import json
import pandas as pd  # Fixed the 'pd' not defined error
from typing import Dict, Any, List
from dotenv import load_dotenv
import os
import re
from components.question_display import display_questions
from utils.state import init_session_state, load_preferences, save_preferences, update_history

# Load environment variables
load_dotenv()

# Get backend URL from environment with fallback
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:8000')

def extract_video_id(url: str) -> str:
    """Extract YouTube video ID from URL"""
    if not url:
        return ""
        
    # Handle different URL formats
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',  # Standard and embedded URLs
        r'youtu.be\/([0-9A-Za-z_-]{11})',    # Shortened URLs
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return url  # Return as-is if no pattern matches

@st.cache_data
def fetch_transcript(video_url: str) -> Dict[str, Any]:
    """Fetch and cache transcript"""
    async def _fetch():
        try:
            async with aiohttp.ClientSession() as session:
                video_id = extract_video_id(video_url)
                if not video_id:
                    return {"status": "error", "error": "Invalid YouTube URL"}
                    
                async with session.get(f"{BACKEND_URL}/api/transcript", params={"video_id": video_id}) as response:
                    if response.status == 404:
                        return {"status": "error", "error": "Backend service not found. Please check if the backend is running."}
                    response.raise_for_status()
                    return await response.json()
        except aiohttp.ClientConnectorError:
            return {"status": "error", "error": f"Cannot connect to backend at {BACKEND_URL}. Please check if the backend is running."}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    try:
        return asyncio.run(_fetch())
    except Exception as e:
        return {"status": "error", "error": str(e)}

@st.cache_data
def generate_questions(transcript: str, jlpt_level: str) -> List[Dict[str, Any]]:
    """Generate and cache questions"""
    async def _generate():
        async with aiohttp.ClientSession() as session:
            # Extract the actual transcript text
            if isinstance(transcript, dict):
                # Handle transcript from YouTube API
                if 'processed_transcript' in transcript:
                    transcript_text = transcript['processed_transcript'].get('full_text', '')
                elif 'transcript' in transcript:
                    transcript_text = transcript['transcript']
                else:
                    transcript_text = str(transcript)
            else:
                transcript_text = str(transcript)

            if not transcript_text.strip():
                return []

            request_data = {
                "transcript": transcript_text,
                "jlpt_level": jlpt_level,
                "num_questions": 5,
                "include_answers": True
            }
            
            headers = {"Content-Type": "application/json"}
            
            try:
                async with session.post(
                    f"{BACKEND_URL}/api/questions/generate",
                    json=request_data,
                    headers=headers
                ) as response:
                    if response.status == 422:
                        error_detail = await response.json()
                        return []
                    
                    response.raise_for_status()
                    result = await response.json()
                    
                    if isinstance(result, dict) and result.get("status") == "success":
                        return result.get("questions", [])
                    elif isinstance(result, dict) and "questions" in result:
                        return result["questions"]
                    elif isinstance(result, list):
                        return result
                        
                    return []
            except Exception as e:
                return []

    try:
        with st.spinner("Generating questions..."):
            questions = asyncio.run(_generate())
            
            if not questions:
                return []
                
            # Convert to serializable format
            return [{
                "question": str(q.get("questionJapanese", q.get("question", ""))),
                "options": [str(opt) for opt in q.get("options", [])],
                "correct_answer": str(q.get("correctAnswer", q.get("correct_answer", ""))),
                "explanation": str(q.get("explanation", ""))
            } for q in questions]
            
    except Exception as e:
        st.error(f"Error generating questions: {str(e)}")
        return []

def main():
    # Initialize state
    init_session_state()
    load_preferences()
    
    st.set_page_config(
        page_title="Listening Comprehension App",
        page_icon="🎧",
        layout="wide"
    )
    
    # Rest of the main function remains the same...