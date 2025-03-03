import streamlit as st
import io

def audio_recorder():
    """Record audio for speech recognition"""
    audio_bytes = st.audio_recorder()
    if audio_bytes:
        return io.BytesIO(audio_bytes)
    return None

def audio_player(audio_bytes):
    """Display audio player for TTS playback"""
    if audio_bytes:
        st.audio(audio_bytes, format='audio/mp3')
