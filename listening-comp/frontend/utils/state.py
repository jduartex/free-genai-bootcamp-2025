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
