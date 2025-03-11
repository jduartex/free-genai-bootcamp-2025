import streamlit as st
import asyncio
import sys
import os
from typing import Dict, Any

# Add the parent directory to the path for absolute imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.api import fetch_transcript, generate_questions
from utils.state import get_state, update_state
from components.question_display import display_questions

st.set_page_config(page_title="Japanese Listening Quiz", page_icon="🎧", layout="wide")

async def main():
    # Load quiz state
    state = get_state()
    
    st.title("🎧 Japanese Listening Practice")
    
    # Check if we have transcript and questions already
    if not state.get("transcript") or not state.get("questions"):
        st.info("Please go to the main page and generate questions from a YouTube video first.")
        if st.button("Go to Main Page"):
            # Clear the entire page and redirect to main
            st.session_state.clear()
            st.switch_page("streamlit_app.py")
    else:
        # Display some information about the video
        st.subheader("Quiz from: " + state.get("video_title", "YouTube Video"))
        
        # Information about the content
        st.markdown(f"**JLPT Level:** {state.get('jlpt_level', 'N5')}")
        st.markdown(f"**Questions:** {len(state.get('questions', []))}")
        
        # Display the questions
        await display_questions(state.get("questions", []))

if __name__ == "__main__":
    # Run the async main function
    asyncio.run(main())
