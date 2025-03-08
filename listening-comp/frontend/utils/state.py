import streamlit as st
from typing import Any, Dict
import json
import os
import logging
import traceback

try:
    import pandas as pd
except ImportError:
    st.error("pandas is required. Please install it with: pip install pandas")
    pd = None

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('listening_app.state')

def init_session_state():
    """Initialize session state variables"""
    try:
        logger.info("Initializing session state")
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
                logger.debug(f"Initialized {key} in session state")
                
        logger.info("Session state initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing session state: {str(e)}")
        logger.debug(traceback.format_exc())
        st.error(f"Failed to initialize app state: {str(e)}")

def save_preferences():
    """Save user preferences to local file"""
    try:
        prefs_file = ".streamlit/user_preferences.json"
        logger.info(f"Saving preferences to {prefs_file}")
        os.makedirs(os.path.dirname(prefs_file), exist_ok=True)
        
        with open(prefs_file, "w") as f:
            json.dump(st.session_state.preferences, f)
            
        logger.info("Preferences saved successfully")
        return True
    except Exception as e:
        logger.error(f"Error saving preferences: {str(e)}")
        logger.debug(traceback.format_exc())
        st.error(f"Failed to save preferences: {str(e)}")
        return False

def load_preferences():
    """Load user preferences from local file"""
    try:
        prefs_file = ".streamlit/user_preferences.json"
        logger.info(f"Loading preferences from {prefs_file}")
        
        if os.path.exists(prefs_file):
            with open(prefs_file, "r") as f:
                prefs = json.load(f)
                
                # Validate the loaded preferences
                required_keys = ["default_jlpt_level", "auto_play_audio", "show_furigana"]
                if all(key in prefs for key in required_keys):
                    st.session_state.preferences = prefs
                    logger.info("Preferences loaded successfully")
                    return True
                else:
                    logger.warning("Preferences file is missing required keys, using defaults")
                    return False
        else:
            logger.info("No preferences file found, using defaults")
            return False
    except json.JSONDecodeError:
        logger.error("Invalid JSON in preferences file")
        st.warning("Your preferences file is corrupted and will be reset.")
        return False
    except Exception as e:
        logger.error(f"Error loading preferences: {str(e)}")
        logger.debug(traceback.format_exc())
        st.error(f"Failed to load preferences: {str(e)}")
        return False

def update_history(video_url: str, questions: list):
    """Update practice history"""
    try:
        if pd is None:
            logger.warning("pandas not available, using string timestamp")
            import datetime
            timestamp = datetime.datetime.now().isoformat()
        else:
            timestamp = str(pd.Timestamp.now())
            
        history_entry = {
            "timestamp": timestamp,
            "video_url": video_url,
            "question_count": len(questions)
        }
        st.session_state.history.append(history_entry)
        logger.info(f"Added entry to history, now contains {len(st.session_state.history)} entries")
    except Exception as e:
        logger.error(f"Error updating history: {str(e)}")
        logger.debug(traceback.format_exc())
        st.error(f"Failed to update history: {str(e)}")

# Debug function
def debug_session_state():
    """Print session state for debugging"""
    try:
        logger.info("Session state debugging requested")
        debug_info = {
            "preferences": st.session_state.preferences,
            "history_count": len(st.session_state.history),
            "current_url": st.session_state.current_progress.get("video_url"),
            "has_questions": st.session_state.current_progress.get("questions") is not None
        }
        logger.info(f"Session state debug info: {json.dumps(debug_info)}")
        return debug_info
    except Exception as e:
        logger.error(f"Error in debug_session_state: {str(e)}")
        return {"error": str(e)}

"""
State management utilities for the Japanese Listening Comprehension App.
This module provides functions to access and update application state.
"""

import os
import json
import logging
from pathlib import Path
import streamlit as st

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Constants
APP_DIR = Path(__file__).parent.parent.parent
PREFS_DIR = APP_DIR / '.streamlit'
PREFS_FILE = PREFS_DIR / 'user_preferences.json'

# Ensure preferences directory exists
PREFS_DIR.mkdir(exist_ok=True)

def get_state():
    """
    Get the current application state from the session.
    If no state exists, create a new one.
    
    Returns:
        dict: Application state
    """
    if 'app_state' not in st.session_state:
        # Initialize with saved preferences if they exist
        st.session_state.app_state = load_preferences()
        
        # Set default values if not in loaded preferences
        defaults = {
            'jlpt_level': 'N5',
            'content_history': [],
            'learning_progress': {},
            'dark_mode': False,
            'audio_settings': {
                'speech_rate': 1.0,
                'voice_gender': 'female'
            },
            'user_stats': {
                'questions_answered': 0,
                'correct_answers': 0,
                'pronunciation_attempts': 0,
                'minutes_practiced': 0
            }
        }
        
        # Apply defaults for missing keys
        for key, value in defaults.items():
            if key not in st.session_state.app_state:
                st.session_state.app_state[key] = value
    
    return st.session_state.app_state

def update_state(key, value):
    """
    Update a specific key in the application state.
    
    Args:
        key (str): The key to update
        value (any): The new value
    
    Returns:
        dict: Updated application state
    """
    state = get_state()
    state[key] = value
    save_preferences(state)
    return state

def load_preferences():
    """
    Load user preferences from the preferences file.
    
    Returns:
        dict: User preferences
    """
    try:
        if PREFS_FILE.exists():
            logger.info(f"Loading preferences from {PREFS_FILE}")
            with open(PREFS_FILE, 'r') as f:
                prefs = json.load(f)
                logger.info("Preferences loaded successfully")
                return prefs
    except Exception as e:
        logger.error(f"Error loading preferences: {e}")
    
    # Return empty preferences if file doesn't exist or an error occurred
    return {}

def save_preferences(state):
    """
    Save user preferences to the preferences file.
    
    Args:
        state (dict): Application state to save
    """
    try:
        with open(PREFS_FILE, 'w') as f:
            json.dump(state, f, indent=2)
            logger.info("Preferences saved successfully")
    except Exception as e:
        logger.error(f"Error saving preferences: {e}")

def reset_state():
    """
    Reset the application state to defaults.
    
    Returns:
        dict: Reset application state
    """
    if 'app_state' in st.session_state:
        del st.session_state.app_state
    
    # Delete preferences file if it exists
    if PREFS_FILE.exists():
        try:
            PREFS_FILE.unlink()
            logger.info("Preferences file deleted")
        except Exception as e:
            logger.error(f"Error deleting preferences file: {e}")
    
    return get_state()

def update_stats(key, increment=1):
    """
    Update user stats by incrementing the specified stat.
    
    Args:
        key (str): The stat to update
        increment (int): The amount to increment
    
    Returns:
        dict: Updated user stats
    """
    state = get_state()
    stats = state.get('user_stats', {})
    
    stats[key] = stats.get(key, 0) + increment
    state['user_stats'] = stats
    
    save_preferences(state)
    return stats

def track_content(content_id, content_type='youtube', title='', duration=0):
    """
    Add content to user history.
    
    Args:
        content_id (str): Unique identifier for the content
        content_type (str): Type of content (youtube, audio, etc.)
        title (str): Content title
        duration (float): Content duration in seconds
        
    Returns:
        list: Updated content history
    """
    state = get_state()
    history = state.get('content_history', [])
    
    # Check if content already exists in history
    for item in history:
        if item.get('id') == content_id:
            # Move to top of history
            history.remove(item)
            history.insert(0, item)
            state['content_history'] = history
            save_preferences(state)
            return history
    
    # Add new content to history
    history.insert(0, {
        'id': content_id,
        'type': content_type,
        'title': title,
        'duration': duration,
        'last_accessed': str(datetime.now())
    })
    
    # Limit history size
    if len(history) > 20:
        history = history[:20]
        
    state['content_history'] = history
    save_preferences(state)
    return history
