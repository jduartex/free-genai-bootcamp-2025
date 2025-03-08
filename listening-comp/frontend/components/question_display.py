import streamlit as st
from typing import List, Dict, Any
import requests
import logging
import asyncio
from datetime import datetime, timedelta
import sys
import os

# Add the parent directory to the path so we can use absolute imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.api import text_to_speech
from components.audio_recorder import audio_recorder, audio_player
from components.pronunciation_feedback import show_pronunciation_feedback, pronunciation_loading_animation

def check_tts_service(api_base_url: str) -> Dict[str, Any]:
    """Check if TTS service is available and properly configured."""
    try:
        # First try the dedicated TTS status endpoint
        response = requests.get(f"{api_base_url}/api/tts/status", timeout=5)
        if response.status_code == 200:
            return response.json()
        
        # Fall back to basic health check
        response = requests.get(f"{api_base_url}/api/health", timeout=5)
        if response.status_code == 200:
            return {"status": "unknown", "message": "Basic API is healthy but TTS status is unknown"}
        
        return {"status": "error", "message": f"API returned status code {response.status_code}"}
    except Exception as e:
        return {"status": "error", "message": f"Error checking TTS service: {str(e)}"}

def play_tts_audio(text: str, jlpt_level: str = None):
    """Play TTS audio for given text."""
    try:
        api_base_url = st.session_state.get('api_base_url', 'http://localhost:8000')
        
        # Check service status (with caching)
        now = datetime.now()
        if (not st.session_state.get('tts_status_checked', False) or 
            now - st.session_state.get('last_tts_check', now) > timedelta(minutes=5)):
            
            tts_status = check_tts_service(api_base_url)
            st.session_state.tts_available = tts_status.get("status") == "ok"
            st.session_state.tts_status = tts_status
            st.session_state.last_tts_check = now
            st.session_state.tts_status_checked = True
        
        if not st.session_state.get('tts_available', False):
            status_msg = st.session_state.get('tts_status', {}).get('message', 'Unknown issue')
            st.warning(f"🔇 TTS service is currently not working: {status_msg}")
            
            # Show suggestions if available
            if suggestions := st.session_state.get('tts_status', {}).get('details', {}).get('suggestion'):
                st.info(f"💡 Suggestion: {suggestions}")
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
            
            # Update status information based on response
            error_info = "Unknown error"
            try:
                error_info = response.json().get('detail', response.text)
            except:
                error_info = response.text
                
            if response.status_code == 404:
                st.error("⚠️ TTS endpoint not found. Please check API configuration.")
            elif response.status_code == 503:
                st.warning(f"🔄 TTS service is temporarily unavailable: {error_info}")
            else:
                st.error(f"⚠️ TTS service error ({response.status_code}): {error_info}")
                
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

# Replace both display_questions functions with this unified version
async def display_questions(questions: List[Dict[str, Any]], auto_play: bool = False, show_furigana: bool = False):
    """
    Display questions with selectable answer options
    
    Args:
        questions: List of question dictionaries with 'question_text', 'options', and 'correct_answer'
        auto_play: Whether to automatically play audio for questions
        show_furigana: Whether to show furigana reading aids
    """
    if not questions:
        st.warning("No questions available.")
        return
    
    # Initialize session state for tracking answers if not already done
    if 'user_answers' not in st.session_state:
        st.session_state.user_answers = [None] * len(questions)
        
    if 'submit_clicked' not in st.session_state:
        st.session_state.submit_clicked = False
        
    if 'show_results' not in st.session_state:
        st.session_state.show_results = False
        
    if 'score' not in st.session_state:
        st.session_state.score = 0
    
    # Function to handle answer selection
    def select_answer(question_idx: int, option_idx: int):
        st.session_state.user_answers[question_idx] = option_idx
    
    # Function to handle submit button click
    def submit_answers():
        st.session_state.submit_clicked = True
        # Calculate score
        correct_count = 0
        for i, question in enumerate(questions):
            if st.session_state.user_answers[i] is not None:
                correct_option_idx = question.get('correct_answer', 0)
                if st.session_state.user_answers[i] == correct_option_idx:
                    correct_count += 1
        
        st.session_state.score = correct_count
        st.session_state.show_results = True
    
    # Display each question with answer options
    for i, question in enumerate(questions):
        # Handle both question formats
        question_text = question.get('question_text') or question.get('question', 'No question text')
        
        # Handle different options formats
        options = []
        if 'options' in question and isinstance(question['options'], list):
            options = question['options']
        elif 'answers' in question and isinstance(question['answers'], list):
            options = [a.get('text', '') for a in question['answers']]
        
        correct_idx = question.get('correct_answer', 0)
        
        # Question container with formatting
        with st.container():
            st.markdown(f"### Question {i+1}")
            
            # Show furigana if enabled
            if show_furigana and 'furigana' in question:
                st.markdown(f"**With furigana:** {question['furigana']}")
            
            st.markdown(question_text)
            
            # Get TTS audio for the question
            tts_col, play_col = st.columns([5, 1])
            with play_col:
                if st.button(f"🔊 Play", key=f"play_q_{i}") or auto_play:
                    with st.spinner("Generating audio..."):
                        try:
                            audio_bytes = await text_to_speech(question_text)
                            if audio_bytes:  # Only store if we got valid bytes
                                st.session_state[f"audio_{i}"] = audio_bytes
                        except Exception as e:
                            st.error(f"Audio generation error: {str(e)}")
            
            # Show audio player if audio has been generated and is valid
            if f"audio_{i}" in st.session_state and st.session_state[f"audio_{i}"]:
                try:
                    audio_player(st.session_state[f"audio_{i}"], key_prefix=f"question_{i}")
                except Exception as e:
                    st.error(f"Audio playback error: {str(e)}")
                    # Remove the problematic audio from session state
                    del st.session_state[f"audio_{i}"]
            
            if options:
                # Display answer options as radio buttons
                selected_option = st.session_state.user_answers[i]
                
                # Create a unique key for the radio group
                radio_key = f"question_{i}_options"
                
                # Display options with radio buttons
                selected = st.radio(
                    "Select your answer:",
                    options=[opt for opt in options],
                    index=selected_option if selected_option is not None else 0,
                    key=radio_key,
                    on_change=select_answer,
                    args=(i, st.session_state.get(radio_key + "_index", 0))
                )
                
                # Store the index of the selected option
                option_index = options.index(selected)
                st.session_state.user_answers[i] = option_index
                
                # For spoken practice - can record pronouncing the answer
                st.markdown("##### Practice pronouncing the answer:")
                
                speak_col1, speak_col2 = st.columns([3, 1])
                with speak_col1:
                    audio_file = audio_recorder(key_prefix=f"question_{i}")
                    
                    if audio_file and f"pronunciation_feedback_{i}" not in st.session_state:
                        # Show loading animation
                        pronunciation_loading_animation()
                        
                        # This would actually call the pronunciation API
                        # For now, we'll simulate the response with dummy data
                        feedback_data = {
                            "success": True,
                            "accuracy": 75,
                            "transcribed_text": selected,
                            "phoneme_scores": {"あ": 90, "い": 80, "う": 60}
                        }
                        st.session_state[f"pronunciation_feedback_{i}"] = feedback_data
                
                # Display pronunciation feedback if available
                if f"pronunciation_feedback_{i}" in st.session_state:
                    show_pronunciation_feedback(
                        st.session_state[f"pronunciation_feedback_{i}"], 
                        selected
                    )
            
            st.divider()
    
    # Submit button at the bottom
    if not st.session_state.submit_clicked:
        st.button("Submit Answers", on_click=submit_answers)
    
    # Show results if submitted
    if st.session_state.show_results:
        st.markdown(f"### Your Score: {st.session_state.score}/{len(questions)}")
        
        # Display each question with correct/incorrect feedback
        for i, question in enumerate(questions):
            user_answer_idx = st.session_state.user_answers[i]
            correct_idx = question.get('correct_answer', 0)
            options = question.get('options', [])
            
            if user_answer_idx == correct_idx:
                st.success(f"Question {i+1}: Correct! ✓")
            else:
                st.error(f"Question {i+1}: Incorrect ✗")
                if options:
                    st.markdown(f"Your answer: {options[user_answer_idx]}")
                    st.markdown(f"Correct answer: {options[correct_idx]}")
        
        # Reset button
        if st.button("Try Again"):
            st.session_state.user_answers = [None] * len(questions)
            st.session_state.submit_clicked = False
            st.session_state.show_results = False
            st.session_state.score = 0
            st.experimental_rerun()
