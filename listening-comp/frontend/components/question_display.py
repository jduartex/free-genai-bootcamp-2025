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
        
    if 'checked_answers' not in st.session_state:
        st.session_state.checked_answers = [False] * len(questions)
    
    # Function to handle answer selection
    def select_answer(question_idx: int, option_idx: int):
        st.session_state.user_answers[question_idx] = option_idx
        # Reset the checked status when answer changes
        st.session_state.checked_answers[question_idx] = False
    
    # Function to check a single question answer
    def check_answer(question_idx: int):
        st.session_state.checked_answers[question_idx] = True
    
    # Function to handle submit button click
    def submit_answers():
        st.session_state.submit_clicked = True
        # Calculate score
        correct_count = 0
        for i, question in enumerate(questions):
            if st.session_state.user_answers[i] is not None:
                # Make sure correct_answer is an integer
                correct_option_idx = question.get('correct_answer', 0)
                try:
                    correct_option_idx = int(correct_option_idx)
                except (ValueError, TypeError):
                    correct_option_idx = 0
                
                if st.session_state.user_answers[i] == correct_option_idx:
                    correct_count += 1
        
        st.session_state.score = correct_count
        st.session_state.show_results = True
        
        # Mark all answers as checked
        st.session_state.checked_answers = [True] * len(questions)
    
    # Add custom CSS to reduce spacing
    st.markdown("""
    <style>
    .question-container {
        border: 1px solid #ddd;
        border-radius: 10px;
        padding: 12px;
        margin-bottom: 6px;  /* Reduced from 10px */
        background-color: #f8f9fa;
    }
    .practice-container {
        border: 1px solid #ddd;
        border-radius: 10px;
        padding: 12px;
        margin-bottom: 6px;  /* Reduced from 10px */
        background-color: #f5f5ff;
    }
    /* Reduce spacing between questions */
    .stDivider {
        margin-top: 0.5rem !important;  /* Reduced from default */
        margin-bottom: 0.5rem !important;  /* Reduced from default */
    }
    /* Reduce spacing after markdown headers */
    .stMarkdown h3 {
        margin-bottom: 0.2rem;
        margin-top: 0.2rem;
    }
    .stMarkdown h4, .stMarkdown h5 {
        margin-bottom: 0.1rem;
        margin-top: 0.1rem;
    }
    /* Reduce padding in containers */
    .element-container {
        margin-top: 0.2rem;
        margin-bottom: 0.2rem;
    }
    </style>
    """, unsafe_allow_html=True)
    
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
        
        # Get the correct answer index, ensuring it's an integer
        correct_idx = question.get('correct_answer', 0)
        try:
            correct_idx = int(correct_idx)
        except (ValueError, TypeError):
            # Default to first option if conversion fails
            correct_idx = 0
        
        # Question container with formatting 
        # Reduce vertical spacing by using custom HTML header instead of st.markdown
        st.markdown(f"""<h3 style="margin-top:0.2rem; margin-bottom:0.2rem;">Question {i+1}</h3>""", unsafe_allow_html=True)
        
        # Create two columns for the layout
        question_col, practice_col = st.columns([3, 2])
        
        # COLUMN 1: Question and Answers
        with question_col:
            # Create a container with border - no need to add CSS inline now since we added it globally above
            with st.container():
                st.markdown('<div class="question-container">', unsafe_allow_html=True)
                
                # Show furigana if enabled
                if show_furigana and 'furigana' in question:
                    st.markdown(f"**With furigana:** {question['furigana']}")
                
                # Question text and play button in same row
                q_text_col, q_play_col = st.columns([5, 1])
                with q_text_col:
                    st.markdown(f"**{question_text}**")
                
                with q_play_col:
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
                
                # Answer options section
                if options:
                    st.markdown("**Select your answer:**")
                    
                    # Create a unique key for the radio group
                    radio_key = f"question_{i}_options"
                    
                    # Display options with radio buttons
                    selected_option = st.session_state.user_answers[i]
                    selected = st.radio(
                        "Options:",
                        options=[opt for opt in options],
                        index=selected_option if selected_option is not None else 0,
                        key=radio_key,
                        on_change=select_answer,
                        args=(i, st.session_state.get(radio_key + "_index", 0)),
                        label_visibility="collapsed"
                    )
                    
                    # Store the index of the selected option
                    option_index = options.index(selected)
                    st.session_state.user_answers[i] = option_index
                    
                    # Check answer button
                    if st.button("Check Answer", key=f"check_q_{i}", use_container_width=True):
                        check_answer(i)
                    
                    # Display immediate feedback if checked
                    if st.session_state.checked_answers[i]:
                        user_answer_idx = st.session_state.user_answers[i]
                        if user_answer_idx == correct_idx:
                            st.success("✓ Correct!")
                        else:
                            # Ensure both indices are valid
                            if 0 <= correct_idx < len(options):
                                st.error(f"✗ Incorrect. The correct answer is: {options[correct_idx]}")
                            else:
                                st.error(f"✗ Incorrect. (Note: correct answer data is invalid)")
                
                st.markdown("</div>", unsafe_allow_html=True)
        
        # COLUMN 2: Pronunciation Practice
        with practice_col:
            with st.container():
                st.markdown('<div class="practice-container">', unsafe_allow_html=True)
                
                # Use smaller header tag for more compact layout
                st.markdown("""<h5 style="margin:0;">Practice Pronunciation</h5>""", unsafe_allow_html=True)
                
                # If we have options, use the correct answer for practice
                practice_text = ""
                if options and 0 <= correct_idx < len(options):
                    practice_text = options[correct_idx]
                    st.markdown(f"**Phrase to practice:** {practice_text}")
                    
                    # Play button for correct answer
                    if st.button("🔊 Listen to correct answer", key=f"play_correct_{i}", use_container_width=True):
                        with st.spinner("Generating audio..."):
                            try:
                                audio_bytes = await text_to_speech(practice_text)
                                st.session_state[f"correct_audio_{i}"] = audio_bytes
                                st.audio(audio_bytes)
                            except Exception as e:
                                st.error(f"Audio generation error: {str(e)}")
                
                # Record button for practice
                st.markdown("##### Record your pronunciation:")
                audio_file = audio_recorder(key_prefix=f"question_{i}")
                
                if audio_file and f"pronunciation_feedback_{i}" not in st.session_state:
                    # Show loading animation
                    pronunciation_loading_animation()
                    
                    # This would actually call the pronunciation API
                    # For now, we'll simulate the response with dummy data
                    feedback_data = {
                        "success": True,
                        "accuracy": 75,
                        "transcribed_text": practice_text if practice_text else "Sample text",
                        "phoneme_scores": {"あ": 90, "い": 80, "う": 60}
                    }
                    st.session_state[f"pronunciation_feedback_{i}"] = feedback_data
                
                # Display pronunciation feedback if available
                if f"pronunciation_feedback_{i}" in st.session_state:
                    show_pronunciation_feedback(
                        st.session_state[f"pronunciation_feedback_{i}"], 
                        practice_text if practice_text else "Sample text"
                    )
                
                st.markdown("</div>", unsafe_allow_html=True)
        
        # Use a smaller divider with less padding
        st.markdown('<hr style="margin:0.3rem 0; border-top:1px solid #eee;">', unsafe_allow_html=True)
    
    # Submit button at the bottom - use columns to make it more prominent
    if not st.session_state.submit_clicked:
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            st.markdown("### Check all your answers")
            if st.button("Submit All Answers", key="submit_all_answers", type="primary", use_container_width=True):
                submit_answers()
    
    # Show results if submitted
    if st.session_state.show_results:
        st.markdown("## Quiz Results")
        
        # Create a visual score display
        score_percentage = (st.session_state.score / len(questions)) * 100
        st.markdown(f"### Your Score: {st.session_state.score}/{len(questions)} ({score_percentage:.1f}%)")
        
        # Add a score progress bar
        st.progress(st.session_state.score / len(questions))
        
        # Add visual feedback based on score
        if score_percentage >= 80:
            st.success("🎉 Great job! You've mastered this content!")
        elif score_percentage >= 60:
            st.info("👍 Good effort! Keep practicing to improve further.")
        else:
            st.warning("📚 Keep studying! You'll do better next time.")
        
        # Display each question with correct/incorrect feedback
        st.markdown("### Question Summary:")
        for i, question in enumerate(questions):
            user_answer_idx = st.session_state.user_answers[i]
            
            # Ensure correct_idx is an integer
            correct_idx = question.get('correct_answer', 0)
            try:
                correct_idx = int(correct_idx)
            except (ValueError, TypeError):
                correct_idx = 0
                
            options = question.get('options', [])
            
            with st.expander(f"Question {i+1}: {question.get('question_text', question.get('question', ''))}"):
                if user_answer_idx == correct_idx:
                    st.success(f"Correct! ✓")
                else:
                    st.error(f"Incorrect ✗")
                
                if options:
                    # Validate indices before accessing options
                    if 0 <= user_answer_idx < len(options):
                        st.markdown(f"**Your answer:** {options[user_answer_idx]}")
                    else:
                        st.markdown(f"**Your answer:** Invalid option")
                        
                    if 0 <= correct_idx < len(options):
                        st.markdown(f"**Correct answer:** {options[correct_idx]}")
                    else:
                        st.markdown(f"**Correct answer:** Data missing")
                
                # Show explanation if available
                if explanation := question.get('explanation'):
                    st.markdown(f"**Explanation:** {explanation}")
        
        # Reset button
        if st.button("Try Again", key="try_again_button"):
            st.session_state.user_answers = [None] * len(questions)
            st.session_state.submit_clicked = False
            st.session_state.show_results = False
            st.session_state.score = 0
            st.session_state.checked_answers = [False] * len(questions)
            st.rerun()  # Use rerun instead of experimental_rerun
