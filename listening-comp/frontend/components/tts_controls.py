"""TTS controls component for the Japanese listening comprehension frontend."""
import streamlit as st
import requests
from typing import Dict, Any, Optional

class TTSControls:
    def __init__(self, api_url: str = "http://localhost:8000"):
        self.api_url = api_url
        if 'tts_settings' not in st.session_state:
            st.session_state.tts_settings = {
                'voice_type': 'female',
                'speaking_style': 'polite',
                'speed': 1.0,
                'pitch': 0.0,
                'volume': 0.0,
                'regional_accent': 'standard'
            }

    def render_voice_settings(self, container) -> Dict[str, Any]:
        """Render TTS voice settings controls."""
        with container:
            col1, col2 = st.columns(2)
            
            with col1:
                st.session_state.tts_settings['voice_type'] = st.selectbox(
                    "Voice Type",
                    ['female', 'male'],
                    index=0 if st.session_state.tts_settings['voice_type'] == 'female' else 1
                )
                
                st.session_state.tts_settings['speaking_style'] = st.selectbox(
                    "Speaking Style",
                    ['polite', 'casual', 'formal', 'humble', 'respectful'],
                    index=['polite', 'casual', 'formal', 'humble', 'respectful'].index(
                        st.session_state.tts_settings['speaking_style']
                    )
                )
            
            with col2:
                st.session_state.tts_settings['regional_accent'] = st.selectbox(
                    "Regional Accent",
                    ['standard', 'kansai', 'tohoku', 'kyushu'],
                    index=['standard', 'kansai', 'tohoku', 'kyushu'].index(
                        st.session_state.tts_settings['regional_accent']
                    )
                )
                
                st.session_state.tts_settings['speed'] = st.slider(
                    "Speaking Speed",
                    min_value=0.5,
                    max_value=2.0,
                    value=st.session_state.tts_settings['speed'],
                    step=0.1
                )
            
            with st.expander("Advanced Settings"):
                st.session_state.tts_settings['pitch'] = st.slider(
                    "Pitch Adjustment",
                    min_value=-10.0,
                    max_value=10.0,
                    value=st.session_state.tts_settings['pitch'],
                    step=0.5
                )
                
                st.session_state.tts_settings['volume'] = st.slider(
                    "Volume Adjustment",
                    min_value=-6.0,
                    max_value=6.0,
                    value=st.session_state.tts_settings['volume'],
                    step=0.5
                )
        
        return st.session_state.tts_settings

    def create_audio_player(self, text: str, jlpt_level: Optional[str] = None) -> None:
        """Create an audio player for the given text."""
        try:
            # Get TTS settings
            settings = st.session_state.tts_settings
            
            # Add JLPT level if provided (for speed adjustment)
            if jlpt_level:
                settings['jlpt_level'] = jlpt_level
            
            # Call TTS API
            response = requests.post(
                f"{self.api_url}/api/tts",
                json={
                    "text": text,
                    **settings
                }
            )
            
            if response.status_code == 200:
                audio_data = response.content
                st.audio(audio_data, format='audio/mp3')
            else:
                st.error(f"Failed to generate audio: {response.text}")
                
        except Exception as e:
            st.error(f"Error generating audio: {str(e)}")

    def render_question_audio(self, question: Dict[str, Any], container) -> None:
        """Render audio controls for a question."""
        with container:
            col1, col2 = st.columns([4, 1])
            
            with col1:
                st.write(question['question_text'])
            
            with col2:
                # Play button that triggers TTS
                if st.button("🔊", key=f"play_{question['id']}"):
                    self.create_audio_player(
                        question['question_text'],
                        question.get('jlpt_level')
                    )
