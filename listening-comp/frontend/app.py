import streamlit as st
import aiohttp
import asyncio
import json
import requests
import pandas as pd  # Add pandas import
from typing import Dict, Any, List
from dotenv import load_dotenv
import os
import re
from components.question_display import display_questions
from utils.api import generate_questions
from utils.state import init_session_state, load_preferences, save_preferences, update_history

# Load environment variables
load_dotenv()

# Get backend URL from environment with fallback
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:8000')

def extract_video_id(url: str) -> str:
    """Extract YouTube video ID from URL"""
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

async def _fetch_transcript_async(video_url):
    try:
        if not BACKEND_URL:
            raise ValueError("Backend URL is not configured. Please set BACKEND_URL in .env file.")
            
        async with aiohttp.ClientSession() as session:
            # Extract video ID from URL
            video_id = extract_video_id(video_url)
            async with session.get(f"{BACKEND_URL}/api/transcript", params={"video_id": video_id}) as response:
                if response.status == 404:
                    st.error("Backend service not found. Please check if the backend is running.")
                    return None
                response.raise_for_status()
                return await response.json()
    except aiohttp.ClientConnectorError:
        st.error(f"Cannot connect to backend at {BACKEND_URL}. Please check if the backend is running.")
        return None
    except Exception as e:
        st.error(f"Error fetching transcript: {str(e)}")
        return None

@st.cache_data
def fetch_transcript(video_url: str) -> Dict[str, Any]:
    """Fetch and cache transcript"""
    async def _fetch():
        async with aiohttp.ClientSession() as session:
            video_id = extract_video_id(video_url)
            async with session.get(f"{BACKEND_URL}/api/transcript", params={"video_id": video_id}) as response:
                response.raise_for_status()
                return await response.json()

    try:
        return asyncio.run(_fetch())
    except Exception as e:
        st.error(f"Error fetching transcript: {str(e)}")
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
                st.error("Empty transcript - cannot generate questions")
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
                        st.error(f"Invalid request: {error_detail}")
                        return []
                    
                    response.raise_for_status()
                    result = await response.json()
                    
                    if result.get("status") != "success":
                        st.error(f"Error from backend: {result.get('detail', 'Unknown error')}")
                        return []
                        
                    return result.get("questions", [])
            except aiohttp.ClientResponseError as e:
                st.error(f"API error: {e.status} - {e.message}")
                return []
            except Exception as e:
                st.error(f"Request failed: {str(e)}")
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
    
    # Preferences sidebar
    with st.sidebar:
        st.subheader("Preferences")
        st.session_state.preferences["default_jlpt_level"] = st.selectbox(
            "Default JLPT Level",
            ["N5", "N4", "N3", "N2", "N1"],
            index=["N5", "N4", "N3", "N2", "N1"].index(
                st.session_state.preferences["default_jlpt_level"]
            )
        )
        st.session_state.preferences["auto_play_audio"] = st.checkbox(
            "Auto-play Audio",
            st.session_state.preferences["auto_play_audio"]
        )
        st.session_state.preferences["show_furigana"] = st.checkbox(
            "Show Furigana",
            st.session_state.preferences["show_furigana"]
        )
        if st.button("Save Preferences"):
            save_preferences()
            st.success("Preferences saved!")
    
    # Main content
    st.title("YouTube Listening Comprehension")
    
    # Use default JLPT level from preferences
    jlpt_level = st.selectbox(
        "Select JLPT Level",
        ["N5", "N4", "N3", "N2", "N1"],
        index=["N5", "N4", "N3", "N2", "N1"].index(
            st.session_state.preferences["default_jlpt_level"]
        )
    )
    
    # Save current video URL in session state
    youtube_url = st.text_input(
        "Enter YouTube URL",
        value=st.session_state.current_progress["video_url"] or "",
        placeholder="https://www.youtube.com/watch?v=..."
    )
    st.session_state.current_progress["video_url"] = youtube_url
    
    if youtube_url:
        if st.button("Generate Questions"):
            try:
                st.info("Fetching video transcript...")
                transcript_data = fetch_transcript(youtube_url)
                
                if transcript_data and transcript_data.get("status") != "error":
                    transcript = transcript_data.get("transcript", "")
                    st.info(f"Generating {jlpt_level} level questions...")
                    
                    # Generate questions
                    questions = generate_questions(transcript, jlpt_level)
                    
                    if questions:
                        # Update history and display questions
                        update_history(youtube_url, questions)
                        st.session_state.current_progress["questions"] = questions
                        
                        display_questions(
                            questions,
                            auto_play=st.session_state.preferences["auto_play_audio"],
                            show_furigana=st.session_state.preferences["show_furigana"]
                        )
                    else:
                        st.error("Failed to generate questions")
                        
            except Exception as e:
                st.error(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    main()
