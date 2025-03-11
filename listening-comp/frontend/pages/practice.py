import streamlit as st
from typing import Dict, Any, List
from components.question_display import display_questions
from utils.service_manager import initialize_backend, check_backend_service
import re

# Add this function to check for specific error patterns
def get_error_details(error_msg):
    """Parse error message and return helpful details."""
    if isinstance(error_msg, str):
        if "404 Not Found" in error_msg and "/api/health" in error_msg:
            return {
                "type": "missing_endpoint",
                "message": "Health check endpoint not found",
                "details": "The backend API is responding but missing the required health check endpoint (/api/health)."
            }
        elif "Connection refused" in error_msg:
            return {
                "type": "connection_refused",
                "message": "Connection refused",
                "details": "The backend server isn't running or is not accepting connections."
            }
    return {
        "type": "unknown",
        "message": str(error_msg),
        "details": "An unexpected error occurred when connecting to the backend."
    }

def render_service_status():
    """Display service status in sidebar."""
    with st.sidebar:
        st.subheader("Service Status")
        
        status_container = st.container()
        with status_container:
            if st.session_state.get('backend_available', False):
                st.success("Backend: Connected ✅")
            else:
                st.error("Backend Service Error ❌")
                error_msg = st.session_state.get('backend_error', "Unknown error")
                error_details = get_error_details(error_msg)
                
                with st.expander("Show Error Details"):
                    st.warning(error_details["message"])
                    st.code(str(error_msg), language='text')
                    st.markdown(f"**Problem:** {error_details['details']}")
                    
                    if error_details["type"] == "missing_endpoint":
                        st.markdown("""
                        **Solution:**
                        1. Verify the backend API has implemented the `/api/health` endpoint
                        2. If the endpoint is different, update the health check URL
                        3. Check backend framework documentation for health check setup
                        """)
                    else:
                        st.markdown("""
                        **Troubleshooting Steps:**
                        1. Check if the backend server is running:
                           ```bash
                           python run_backend.py
                           ```
                        2. Verify port 8000 is not in use
                        3. Check backend logs for errors
                        4. Ensure network connectivity
                        """)
            
            col1, col2 = st.columns([3, 1])
            with col1:
                st.text(f"URL: {st.session_state.get('api_base_url', 'Not set')}")
            with col2:
                if st.button("🔄 Retry"):
                    initialize_backend(force=True)
        
        # Backend URL configuration
        new_url = st.text_input("Backend URL", 
                               value=st.session_state.get('api_base_url', 'http://localhost:8000'))
        if new_url != st.session_state.get('api_base_url'):
            st.session_state.api_base_url = new_url
            initialize_backend(force=True)
            
        # Advanced configuration - health check endpoint
        with st.expander("Advanced Settings"):
            health_endpoint = st.text_input(
                "Health Check Endpoint", 
                value=st.session_state.get('health_endpoint', '/api/health')
            )
            if health_endpoint != st.session_state.get('health_endpoint'):
                st.session_state.health_endpoint = health_endpoint
                if st.button("Apply Health Endpoint Change"):
                    initialize_backend(force=True)
            
            # Add manual override option
            override = st.checkbox(
                "Override Backend Check", 
                value=st.session_state.get("manual_override", False),
                help="Force the app to work even if health check fails"
            )
            if override != st.session_state.get("manual_override", False):
                st.session_state.manual_override = override
                initialize_backend(force=True)
                st.experimental_rerun()

def get_questions(level: str) -> List[Dict[str, Any]]:
    """Fetch questions for the selected JLPT level."""
    try:
        # Make an API call to the backend to fetch questions
        import requests
        
        # Get the API base URL from session state
        base_url = st.session_state.get('api_base_url', 'http://localhost:8000')
        endpoint = f"/api/questions?level={level}"
        
        response = requests.get(f"{base_url}{endpoint}")
        
        # If the response is successful, return the questions
        if response.status_code == 200:
            return response.json()
        
        # If there was an error with the API call, log it and fall back to sample questions
        st.warning(f"Could not fetch questions from API: {response.status_code} - {response.text}")
        
        # Fall back to sample questions
        return [
            {
                "id": 1,
                "question_text": "こんにちは、お元気ですか？",
                "jlpt_level": level,
                "answers": [
                    {"text": "はい、元気です。", "correct": True},
                    {"text": "いいえ、魚です。", "correct": False},
                    {"text": "ありがとうございます。", "correct": False}
                ]
            },
            {
                "id": 2,
                "question_text": "この本は何ページですか？",
                "jlpt_level": level,
                "answers": [
                    {"text": "百ページです。", "correct": True},
                    {"text": "赤い本です。", "correct": False},
                    {"text": "図書館です。", "correct": False}
                ]
            }
        ]
    except Exception as e:
        st.error(f"Error fetching questions: {str(e)}")
        return []

def render_tts_settings():
    """Render TTS settings in sidebar."""
    with st.sidebar:
        st.subheader("Voice Settings")
        
        st.session_state.voice_type = st.selectbox(
            "Voice Type",
            ["female", "male"],
            key="voice_select"
        )
        
        st.session_state.speaking_style = st.selectbox(
            "Speaking Style",
            ["polite", "casual", "formal"],
            key="style_select"
        )
        
        st.session_state.speed = st.slider(
            "Speaking Speed",
            min_value=0.5,
            max_value=2.0,
            value=1.0,
            step=0.1,
            key="speed_slider"
        )

def main():
    st.set_page_config(page_title="Japanese Listening Practice", layout="wide")
    
    # Initialize backend first with better error handling
    if not initialize_backend():
        st.error("⚠️ Japanese Listening Practice Service Unavailable")
        render_service_status()
        return
    
    # Load audio button styles
    st.markdown("""
        <style>
        .stButton > button {
            border-radius: 50%;
            width: 36px !important;
            height: 36px !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center;
            justify-content: center;
            background-color: #4CAF50 !important;
            color: white !important;
            border: none !important;
            font-size: 18px !important;
            margin: 4px auto !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        }
        </style>
    """, unsafe_allow_html=True)
    
    st.title("Japanese Listening Practice")
    
    # Initialize session state
    if 'voice_type' not in st.session_state:
        st.session_state.voice_type = 'female'
    if 'speaking_style' not in st.session_state:
        st.session_state.speaking_style = 'polite'
    if 'speed' not in st.session_state:
        st.session_state.speed = 1.0
    
    render_service_status()
    render_tts_settings()
    
    # Only show practice content if backend is available
    if st.session_state.get('backend_available', False) or st.session_state.get("manual_override", False):
        level = st.selectbox("JLPT Level", ["N5", "N4", "N3", "N2", "N1"])
        questions = get_questions(level)
        
        if questions:
            display_questions(questions, auto_play=False)
        else:
            st.warning("No questions available for this level.")
    else:
        st.error("⚠️ Backend service is not available. Please check the connection and try again.")

if __name__ == "__main__":
    main()