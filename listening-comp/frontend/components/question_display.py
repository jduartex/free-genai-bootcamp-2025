import streamlit as st
from typing import List, Dict, Any
import requests
import logging
from datetime import datetime, timedelta

def check_tts_service(api_base_url: str) -> bool:
    """Check if TTS service is available."""
    try:
        response = requests.get(f"{api_base_url}/api/health", timeout=5)
        return response.status_code == 200
    except Exception:
        return False

def play_tts_audio(text: str, jlpt_level: str = None):
    """Play TTS audio for given text."""
    try:
        api_base_url = st.session_state.get('api_base_url', 'http://localhost:8000')
        
        # Check service status (with caching)
        now = datetime.now()
        if (not st.session_state.get('tts_available', False) or 
            now - st.session_state.get('last_tts_check', now) > timedelta(minutes=1)):
            st.session_state.tts_available = check_tts_service(api_base_url)
            st.session_state.last_tts_check = now
        
        if not st.session_state.tts_available:
            st.warning("🔇 TTS service is currently offline. Please try again later.")
            return

        response = requests.post(
            f"{api_base_url}/api/tts/synthesize",
            json={
                "text": text,
                "voice_type": st.session_state.get('voice_type', 'female'),
                "speaking_style": st.session_state.get('speaking_style', 'polite'),
                "speed": st.session_state.get('speed', 1.0),
                "jlpt_level": jlpt_level
            },
            headers={
                "Content-Type": "application/json",
                "Accept": "audio/mpeg, audio/wav"  # Accept multiple audio formats
            },
            timeout=15  # Increased timeout for TTS generation
        )
        
        if response.status_code == 200:
            audio_bytes = response.content
            st.audio(audio_bytes, format='audio/mp3')
            st.session_state.tts_available = True  # Confirm service is working
        else:
            st.session_state.tts_available = False
            if response.status_code == 404:
                st.error("⚠️ TTS endpoint not found. Please check API configuration.")
            elif response.status_code == 503:
                st.warning("🔄 TTS service is temporarily unavailable. Please try again later.")
            else:
                st.error(f"⚠️ TTS service error: {response.status_code}")
                
            if st.session_state.get('dev_mode', False):
                st.error(f"Response: {response.text}")
            
    except requests.Timeout:
        st.warning("⏳ TTS request timed out. Please try again.")
    except Exception as e:
        st.error("⚠️ Failed to generate audio")
        if st.session_state.get('dev_mode', False):
            st.error(f"Error details: {str(e)}")

def render_question_card(question: Dict[str, Any], question_number: int):
    """Render a question card with audio controls."""
    # Handle both question formats
    question_text = question.get('question_text') or question.get('question')
    if not question_text:
        st.error(f"Invalid question format: {question}")
        return

    with st.container():
        st.markdown("""
            <style>
                .question-card {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 10px 0;
                }
            </style>
        """, unsafe_allow_html=True)
        
        with st.container():
            st.markdown('<div class="question-card">', unsafe_allow_html=True)
            
            # Question header with play button
            st.markdown(f"### Question {question_number}")
            col1, col2 = st.columns([8, 1])
            with col1:
                st.markdown(f"{question_text}")
            with col2:
                if st.button("🔊", key=f"q_{question_number}_audio"):
                    play_tts_audio(question_text, question.get('jlpt_level'))

            # Answer options - handle both formats
            answers = []
            if 'answers' in question:
                answers = [{'text': a['text'], 'correct': a['correct']} for a in question['answers']]
            elif 'options' in question:
                correct_answer = question.get('correct_answer')
                answers = [{'text': opt, 'correct': opt == correct_answer} for opt in question['options']]

            if answers:
                st.markdown("#### Answers")
                for idx, answer in enumerate(answers):
                    cols = st.columns([0.5, 6, 1])
                    with cols[0]:
                        st.radio(
                            f"Answer option {idx+1}", 
                            ["Select"],
                            key=f"q{question_number}_a{idx}",
                            label_visibility="collapsed"
                        )
                    with cols[1]:
                        st.markdown(f"{chr(65+idx)}. {answer['text']}")
                    with cols[2]:
                        if st.button("🔊", key=f"a_{question_number}_{idx}_audio"):
                            play_tts_audio(answer['text'], question.get('jlpt_level'))
            
            # Show explanation if available
            if explanation := question.get('explanation'):
                with st.expander("Explanation"):
                    st.markdown(explanation)
            
            st.markdown('</div>', unsafe_allow_html=True)

def display_questions(questions: List[Dict[str, Any]], auto_play: bool = False, show_furigana: bool = False):
    """Display a list of questions with audio controls."""
    if not questions or not isinstance(questions, list):
        st.warning("No questions available.")
        return

    for idx, question in enumerate(questions, start=1):
        if isinstance(question, dict):
            render_question_card(question, idx)
            if auto_play and 'question_text' in question:
                play_tts_audio(question['question_text'], question.get('jlpt_level'))
        else:
            st.error(f"Invalid question format at index {idx}")
