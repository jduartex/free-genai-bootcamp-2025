import streamlit as st
import requests
import json
import os
import time
import base64
from urllib.parse import urlparse, parse_qs
from io import BytesIO
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Configuration
API_URL = "http://localhost:8000"  # Change if backend runs on a different URL

# Set page title and configuration
st.set_page_config(
    page_title="Japanese Listening Comprehension App",
    page_icon="🎧",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Helper functions
def extract_youtube_id(url):
    """Extract YouTube video ID from URL"""
    parsed_url = urlparse(url)
    if parsed_url.hostname in ('youtu.be',):
        return parsed_url.path[1:]
    if parsed_url.hostname in ('www.youtube.com', 'youtube.com'):
        if parsed_url.path == '/watch':
            return parse_qs(parsed_url.query)['v'][0]
        if parsed_url.path.startswith('/embed/'):
            return parsed_url.path.split('/')[2]
        if parsed_url.path.startswith('/v/'):
            return parsed_url.path.split('/')[2]
    # Invalid YouTube URL
    return None

def get_transcript(video_id):
    """Fetch transcript from API"""
    try:
        response = requests.get(f"{API_URL}/api/transcript?video_id={video_id}")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"Error fetching transcript: {str(e)}")
        return None

def generate_questions(transcript, jlpt_level, num_questions):
    """Generate questions from API"""
    try:
        payload = {
            "transcript": transcript,
            "jlpt_level": jlpt_level,
            "num_questions": num_questions,
            "include_answers": True
        }
        response = requests.post(f"{API_URL}/api/questions/generate", json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"Error generating questions: {str(e)}")
        return None

def text_to_speech(text, voice_id="Mizuki"):
    """Convert text to speech using API"""
    try:
        payload = {
            "text": text,
            "voice_id": voice_id,
            "engine": "neural"
        }
        response = requests.post(f"{API_URL}/api/tts", json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"Error generating speech: {str(e)}")
        return None

def get_audio_html(audio_file):
    """Generate HTML audio player for the audio file"""
    try:
        # Read audio file and encode as base64
        with open(audio_file, "rb") as f:
            audio_bytes = f.read()
        audio_base64 = base64.b64encode(audio_bytes).decode()
        
        # Create HTML audio element
        audio_html = f"""
        <audio controls>
            <source src="data:audio/mp3;base64,{audio_base64}" type="audio/mp3">
            Your browser does not support the audio element.
        </audio>
        """
        return audio_html
    except Exception as e:
        st.error(f"Error creating audio player: {str(e)}")
        return None

# Main application
st.title("日本語リスニング練習 - Japanese Listening Comprehension")

# Sidebar with options
st.sidebar.header("設定 (Settings)")
jlpt_level = st.sidebar.selectbox(
    "JLPT Level", 
    ["N5", "N4", "N3", "N2", "N1"],
    format_func=lambda x: f"{x} ({['Beginner', 'Basic', 'Intermediate', 'Pre-Advanced', 'Advanced'][['N5', 'N4', 'N3', 'N2', 'N1'].index(x)]})",
    index=1  # Default to N4
)

num_questions = st.sidebar.slider("Number of Questions", min_value=1, max_value=10, value=3)

voice_options = {
    "Mizuki": "Female (Amazon Polly)",