import streamlit as st
import aiohttp
import asyncio
import json
import requests
import pandas as pd  # Ensure pandas is imported
from typing import Dict, Any, List
from dotenv import load_dotenv
import os
import re
import sys

# Add the current directory to the path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Now use absolute imports
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
    """Cached wrapper for transcript fetching"""
    try:
        video_id = extract_video_id(video_url)
        print(f"Requesting transcript for video ID: {video_id}")  # Debug print
        
        # Check if backend URL is properly set
        print(f"Using backend URL: {BACKEND_URL}")  # Debug print
        
        response = requests.get(
            f"{BACKEND_URL}/api/transcript",
            params={"video_id": video_id}
        )
        
        # Print response status
        print(f"Transcript API response status: {response.status_code}")  # Debug print
        
        response.raise_for_status()
        result = response.json()
        
        # Print first 100 chars of result for debugging
        print(f"Transcript response preview: {str(result)[:100]}...")  # Debug print
        
        return result
    except Exception as e:
        print(f"TRANSCRIPT ERROR: {str(e)}")  # More visible error
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
                print(f"Processing transcript: {len(transcript_text)} characters")  # Debug print
                print(f"Sending to LLM for {jlpt_level} questions")  # Debug print
                
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
                    
                    print(f"LLM response received: {len(str(result))} characters")  # Debug print
                    
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

def generate_questions_sync(transcript: str, jlpt_level: str) -> List[Dict[str, Any]]:
    """Synchronous wrapper for generate_questions"""
    try:
        # Debug print to verify transcript
        print(f"Transcript type: {type(transcript)}")
        if isinstance(transcript, dict):
            print(f"Transcript keys: {transcript.keys()}")
        
        # Extract transcript text from dictionary if needed
        if isinstance(transcript, dict):
            if 'processed_transcript' in transcript:
                cleaned_transcript = transcript['processed_transcript'].get('full_text', '').strip()
            else:
                cleaned_transcript = transcript.get('transcript', '').strip()
        else:
            cleaned_transcript = str(transcript).strip()

        if not cleaned_transcript:
            st.error("Empty transcript received")
            return []

        # Update payload structure to match API requirements
        payload = {
            "transcript": cleaned_transcript,
            "jlpt_level": jlpt_level,
            "num_questions": 5
        }

        # Before making the API call
        print(f"Sending request to {BACKEND_URL}/api/questions/generate")
        print(f"Payload: {json.dumps(payload)[:200]}...")  # First 200 chars

        # Check backend connectivity first
        try:
            health_check = requests.get(f"{BACKEND_URL}/health", timeout=3)
            print(f"Backend health check: {health_check.status_code}")
        except requests.exceptions.RequestException:
            print("Backend appears to be down!")
            st.error("Cannot connect to backend service. Please check if it's running.")
            return []

        response = requests.post(
            f"{BACKEND_URL}/api/questions/generate",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 422:
            error_detail = response.json()
            st.error(f"API validation error: {error_detail}")
            return []
            
        response.raise_for_status()
        result = response.json()
        
        # Check if we got fallback questions (based on the backend log)
        if isinstance(result, dict) and result.get("status") == "fallback":
            st.warning("Using fallback questions due to API quota limits")
            return result.get("questions", [])
        
        # Handle different response structures
        if isinstance(result, list):
            return result
        elif isinstance(result, dict):
            return result.get("questions", [])
        return []
        
    except Exception as e:
        st.error(f"Error generating questions: {str(e)}")
        return []

def init_session_state():
    """Initialize session state variables"""
    if 'preferences' not in st.session_state:
        st.session_state.preferences = {
            "default_jlpt_level": "N5",
            "auto_play_audio": True,
            "show_furigana": True
        }
    
    if 'current_progress' not in st.session_state:
        st.session_state.current_progress = {
            "video_url": "",
            "questions": []
        }
    
    if 'history' not in st.session_state:
        st.session_state.history = []
        
    # Add a new state variable to store generated questions
    if 'generated_questions' not in st.session_state:
        st.session_state.generated_questions = None

# Function to generate questions and store in session state
def generate_and_store_questions():
    youtube_url = st.session_state.youtube_url_input
    jlpt_level = st.session_state.jlpt_level_select
    
    try:
        with st.spinner("Fetching video transcript..."):
            transcript_data = fetch_transcript(youtube_url)
            
            if transcript_data and transcript_data.get("status") != "error":
                transcript = transcript_data.get("transcript", "")
                
                with st.spinner(f"Generating {jlpt_level} level questions..."):
                    # Generate questions
                    questions = generate_questions(transcript, jlpt_level)
                    
                    if questions:
                        # Store questions in session state
                        st.session_state.generated_questions = questions
                        
                        # Update history
                        update_history(youtube_url, questions)
                        st.session_state.current_progress["questions"] = questions
                        
                        # Set the active tab to the quiz tab
                        st.session_state.active_tab = "Quiz"
                    else:
                        st.error("Failed to generate questions")
            else:
                st.error("Failed to fetch transcript. Please check the URL and try again.")
                
    except Exception as e:
        st.error(f"An error occurred: {str(e)}")

async def main():
    # Initialize state - THIS MUST COME FIRST
    init_session_state()
    load_preferences()
    
    st.set_page_config(
        page_title="Listening Comprehension App",
        page_icon="🎧",
        layout="wide"
    )
    
    # Set default active tab if not already set
    if 'active_tab' not in st.session_state:
        st.session_state.active_tab = "Settings"
    
    # Preferences sidebar - Keep this the same
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
    st.title("Japanese Listening Comprehension")
    
    # Create tabs to separate settings from quiz
    tabs = st.tabs(["Settings", "Quiz"])
    
    # Update active tab based on which tab is currently active
    # This is more reliable than using buttons inside tabs
    if tabs[0].button("Show Settings", key="btn_settings_tab"):
        st.session_state.active_tab = "Settings"
        st.rerun()
        
    if tabs[1].button("Show Quiz", key="btn_quiz_tab"):
        st.session_state.active_tab = "Quiz"
        st.rerun()
    
    # Settings tab content
    if st.session_state.active_tab == "Settings":
        with tabs[0]:
            st.header("Quiz Settings")
            
            # JLPT Level selectbox - store in session_state
            jlpt_level = st.selectbox(
                "Select JLPT Level",
                ["N5", "N4", "N3", "N2", "N1"],
                index=["N5", "N4", "N3", "N2", "N1"].index(
                    st.session_state.preferences["default_jlpt_level"]
                ),
                key="jlpt_level_select"
            )
            
            # YouTube URL input - store in session_state
            youtube_url = st.text_input(
                "Enter YouTube URL",
                value=st.session_state.current_progress["video_url"] or "",
                placeholder="https://www.youtube.com/watch?v=...",
                key="youtube_url_input"
            )
            
            # Store URL in current_progress
            st.session_state.current_progress["video_url"] = youtube_url
            
            # Generate Questions button - with callback to avoid rerun issues
            if st.button("Generate Questions", 
                         on_click=generate_and_store_questions):
                pass  # Action happens in the callback
                
            st.info("Click 'Generate Questions' to create new questions, then switch to the 'Quiz' tab")
    
    # Quiz tab content
    if st.session_state.active_tab == "Quiz":
        with tabs[1]:
            if st.session_state.generated_questions:
                # Await the async display_questions function
                await display_questions(
                    st.session_state.generated_questions,
                    auto_play=st.session_state.preferences.get("auto_play_audio", False),
                    show_furigana=st.session_state.preferences.get("show_furigana", False)
                )
            else:
                st.info("No questions generated yet. Go to Settings tab to generate questions.")
                
                # Add a debug message to see what's in the session state
                st.write("Debug: Check if questions were generated")
                if st.checkbox("Show session state"):
                    st.write("Generated questions:", st.session_state.get('generated_questions'))
                
                # Optional: Add a button to go to settings
                if st.button("Go to Settings"):
                    st.session_state.active_tab = "Settings"
                    st.rerun()

if __name__ == "__main__":
    asyncio.run(main())
