import streamlit as st
from typing import Dict, Any
import requests

class QuestionViewer:
    def __init__(self):
        self.tts_api_url = "http://localhost:8000/api/tts"
        
    def _play_audio(self, text: str, jlpt_level: str = None):
        """Generate and play TTS audio."""
        try:
            response = requests.post(
                f"{self.tts_api_url}/synthesize",
                json={
                    "text": text,
                    "voice_type": st.session_state.get('voice_type', 'female'),
                    "speaking_style": st.session_state.get('speaking_style', 'polite'),
                    "speed": st.session_state.get('speed', 1.0),
                    "jlpt_level": jlpt_level
                }
            )
            
            if response.status_code == 200:
                return response.content
            return None
            
        except Exception as e:
            st.error(f"Audio generation failed: {str(e)}")
            return None
    
    def render_answer_option(self, question_id: int, answer: Dict[str, Any], index: int):
        """Render a single answer option with audio control."""
        cols = st.columns([1, 4, 1])
        
        with cols[0]:
            selected = st.radio(
                "",
                [""],
                key=f"q{question_id}_a{index}"
            )
        
        with cols[1]:
            st.write(answer['text'])
        
        with cols[2]:
            if st.button("🔊", key=f"play_a_{question_id}_{index}"):
                audio = self._play_audio(answer['text'])
                if audio:
                    st.audio(audio, format='audio/mp3')
    
    def render_question(self, question: Dict[str, Any]):
        """Render a question with all its components."""
        with st.container():
            # Question text with audio
            cols = st.columns([5, 1])
            with cols[0]:
                st.markdown(f"### {question['question_text']}")
            with cols[1]:
                if st.button("🔊", key=f"play_q_{question['id']}"):
                    audio = self._play_audio(
                        question['question_text'], 
                        question.get('jlpt_level')
                    )
                    if audio:
                        st.audio(audio, format='audio/mp3')
            
            # Answer options
            for idx, answer in enumerate(question.get('answers', [])):
                self.render_answer_option(question['id'], answer, idx)
            
            st.markdown("---")
