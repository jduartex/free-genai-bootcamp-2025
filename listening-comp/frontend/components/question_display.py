import streamlit as st
from .audio_recorder import audio_recorder, audio_player
from utils.api import text_to_speech, speech_to_text

def display_questions(questions: list):
    """Display questions and handle user responses"""
    if not questions:
        return
    
    for i, q in enumerate(questions, 1):
        with st.container():
            st.subheader(f"Question {i}")
            st.write(q["question"])
            
            # TTS for question
            if st.button(f"Listen to Question {i}", key=f"listen_{i}"):
                audio_bytes = text_to_speech(q["question"])
                audio_player(audio_bytes)
            
            # Text input or speech input
            input_method = st.radio(
                f"Answer method for question {i}",
                ["Text", "Voice"],
                key=f"method_{i}"
            )
            
            if input_method == "Text":
                user_answer = st.text_input(
                    f"Your answer for question {i}",
                    key=f"q_{i}"
                )
            else:
                st.write("Record your answer:")
                audio_file = audio_recorder()
                if audio_file:
                    response = speech_to_text(audio_file)
                    user_answer = response.get("text", "")
                    st.write(f"Transcribed answer: {user_answer}")
            
            if "correct_answer" in q:
                st.info(f"Correct answer: {q['correct_answer']}")
            
            st.divider()
