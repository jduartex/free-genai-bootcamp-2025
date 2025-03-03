import streamlit as st
from typing import Any, Dict
import json
import os

def init_session_state():
    """Initialize session state variables"""
    defaults = {
        "history": [],
        "preferences": {
            "default_jlpt_level": "N5",
            "auto_play_audio": False,
            "show_furigana": True
        },
        "current_progress": {
            "video_url": None,
            "questions": None,
            "answers": {}
        }
    }
    
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value

def save_preferences():
    """Save user preferences to local file"""
    prefs_file = ".streamlit/user_preferences.json"
    os.makedirs(os.path.dirname(prefs_file), exist_ok=True)
    
    with open(prefs_file, "w") as f:
        json.dump(st.session_state.preferences, f)

def load_preferences():
    """Load user preferences from local file"""
    prefs_file = ".streamlit/user_preferences.json"
    if os.path.exists(prefs_file):
        with open(prefs_file, "r") as f:
            st.session_state.preferences = json.load(f)

def update_history(video_url: str, questions: list):
    """Update practice history"""
    history_entry = {
        "timestamp": str(pd.Timestamp.now()),
        "video_url": video_url,
        "question_count": len(questions)
    }
    st.session_state.history.append(history_entry)
