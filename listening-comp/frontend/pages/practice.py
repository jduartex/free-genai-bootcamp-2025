import streamlit as st
from typing import Dict, Any, List
from components.question_display import display_questions
from utils.service_manager import initialize_backend, check_backend_service

def render_service_status():
    """Display service status in sidebar."""
    with st.sidebar:
        st.subheader("Service Status")
        
        col1, col2 = st.columns([3, 1])
        with col1:
            # Backend status
            if st.session_state.get('backend_available', False):
                st.success("Backend: Connected ✅")
            else:
                st.error("Backend: Offline ❌")
                if error := st.session_state.get('backend_error'):
                    st.info(f"Error: {error}")
        with col2:
            if st.button("🔄 Retry"):
                initialize_backend(force=True)
        
        # Backend URL configuration
        new_url = st.text_input("Backend URL", 
                               value=st.session_state.get('api_base_url', 'http://localhost:8000'))
        if new_url != st.session_state.get('api_base_url'):
            st.session_state.api_base_url = new_url
            initialize_backend(force=True)

def get_questions(level: str) -> List[Dict[str, Any]]:
    """Fetch questions for the selected JLPT level."""
    try:
        # TODO: Replace with actual API call when backend is ready
        # For now, return sample questions
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
        st.error("⚠️ Backend service is not available")
        render_service_status()
        st.info("Please check:")
        st.markdown("""
        1. Is the backend server running? (`python run_backend.py`)
        2. Is port 8000 available?
        3. Check the console for Python errors
        """)
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
    if st.session_state.get('backend_available', False):
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