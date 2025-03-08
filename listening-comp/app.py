"""
Main application file for the Japanese Listening Comprehension App.
"""

import streamlit as st
import sys
import os
from pathlib import Path

# Add backend to path for imports
backend_path = Path(__file__).parent / "backend"
if str(backend_path.absolute()) not in sys.path:
    sys.path.append(str(backend_path.absolute()))

# Set page configuration
st.set_page_config(
    page_title="Japanese Listening Comprehension",
    page_icon="🇯🇵",
    layout="wide",
    initial_sidebar_state="expanded"
)

def main():
    st.title("🎧 Japanese Listening Comprehension App")
    
    st.markdown("""
    ## Welcome to your Japanese learning assistant!
    
    This application helps you improve your Japanese listening comprehension skills through interactive
    exercises with authentic Japanese content. Practice with YouTube videos, get personalized questions,
    and receive feedback on your pronunciation.
    
    ### Features:
    - **Listen**: Practice with Japanese audio from various sources
    - **Understand**: Answer comprehension questions about what you heard
    - **Speak**: Practice your pronunciation with AI feedback
    - **Learn**: Build vocabulary and grammar knowledge
    
    Get started by selecting a feature from the sidebar!
    """)
    
    # Show a quick start guide
    with st.expander("📋 Quick Start Guide"):
        st.markdown("""
        1. **Select content**: Choose a Japanese YouTube video or use our pre-selected content
        2. **Set your level**: Select your JLPT level (N5-N1)
        3. **Practice listening**: Listen to the content and answer questions
        4. **Get feedback**: Receive instant feedback on your answers
        5. **Practice speaking**: Use the pronunciation practice tool to improve your speaking
        
        The app will personalize exercises based on your Japanese proficiency level.
        """)
    
    # Show recent progress if available
    if 'user_progress' in st.session_state:
        st.subheader("Recent Progress")
        st.info("Progress tracking will be available in a future update.")

# Run the main app
if __name__ == "__main__":
    main()
