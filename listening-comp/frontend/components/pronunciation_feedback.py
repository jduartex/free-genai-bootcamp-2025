import streamlit as st
from typing import Dict, Any, Optional
import time

def show_pronunciation_feedback(feedback_data: Dict[str, Any], expected_text: str):
    """
    Display pronunciation feedback with visualizations and helpful tips.
    
    Args:
        feedback_data: The feedback data from the API containing accuracy scores
        expected_text: The text the user was expected to pronounce
    """
    if not feedback_data:
        return
    
    st.subheader("発音フィードバック (Pronunciation Feedback)")
    
    # Get the overall accuracy score and transcribed text
    accuracy = feedback_data.get("accuracy", 0)
    transcribed_text = feedback_data.get("transcribed_text", "")
    phoneme_scores = feedback_data.get("phoneme_scores", {})
    
    # Show the overall accuracy with a progress bar
    st.markdown("### Overall Accuracy")
    st.progress(accuracy / 100)
    
    # Color coding based on accuracy
    if accuracy >= 80:
        st.success(f"{accuracy:.1f}% - 素晴らしい！ (Excellent!)")
    elif accuracy >= 60:
        st.info(f"{accuracy:.1f}% - 良い (Good)")
    else:
        st.warning(f"{accuracy:.1f}% - もっと練習が必要です (Needs more practice)")
    
    # Show what you said vs what was expected
    st.markdown("### Comparison")
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("**Expected:**")
        st.info(expected_text)
        
    with col2:
        st.markdown("**You said:**")
        st.info(transcribed_text)
    
    # Show detailed feedback on specific sounds if available
    if phoneme_scores:
        st.markdown("### Detailed Feedback")
        
        for phoneme, score in phoneme_scores.items():
            col1, col2 = st.columns([1, 4])
            with col1:
                st.markdown(f"**{phoneme}**")
            with col2:
                st.progress(score / 100)
                
                if score < 60:
                    st.markdown(f"Try practicing the '{phoneme}' sound more")
    
    # Tips for improvement
    st.markdown("### Tips for Improvement")
    tips = [
        "Listen to native speakers and mimic their pronunciation",
        "Record yourself speaking and compare with native speakers",
        "Practice the specific sounds marked in red",
        "Slow down when pronouncing difficult words",
        "Focus on rhythm and intonation"
    ]
    
    for tip in tips:
        st.markdown(f"• {tip}")

def pronunciation_loading_animation():
    """Display a loading animation while pronunciation analysis is happening"""
    with st.spinner("Analyzing your pronunciation..."):
        progress_bar = st.progress(0)
        for i in range(100):
            time.sleep(0.01)  # Simulate processing time
            progress_bar.progress(i + 1)
        st.success("Analysis complete!")
