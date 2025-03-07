import streamlit as st
import numpy as np
import io
import tempfile
from pathlib import Path
from datetime import datetime

def audio_recorder():
    """
    Display an audio recorder component that allows users to record audio for ASR.
    Returns the recorded audio file when the recording is complete.
    """
    # Session state to track recording status
    if 'audio_recording_complete' not in st.session_state:
        st.session_state.audio_recording_complete = False
        
    if 'recorded_audio' not in st.session_state:
        st.session_state.recorded_audio = None
    
    col1, col2 = st.columns([3, 1])
    
    with col1:
        # Only show the recorder if we don't have a recording yet
        if not st.session_state.audio_recording_complete:
            audio_bytes = st.audio_recorder(
                sampling_rate=16000,  # 16kHz sampling rate for better ASR
                pause_threshold=2.0   # Stop recording after 2 seconds of silence
            )
            
            if audio_bytes:
                # We have a recording, save it to session state
                st.session_state.recorded_audio = audio_bytes
                st.session_state.audio_recording_complete = True
                
                # Save the recording to a temporary file
                temp_dir = Path(tempfile.gettempdir())
                timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
                temp_file = temp_dir / f"recording_{timestamp}.wav"
                
                with open(temp_file, "wb") as f:
                    f.write(audio_bytes)
                
                # Create a file-like object from the bytes for API consumption
                audio_file = io.BytesIO(audio_bytes)
                audio_file.name = f"recording_{timestamp}.wav"
                
                return audio_file
        else:
            # Show the recorded audio playback
            st.audio(st.session_state.recorded_audio)
    
    with col2:
        # Reset button
        if st.session_state.audio_recording_complete:
            if st.button("Record Again"):
                st.session_state.audio_recording_complete = False
                st.session_state.recorded_audio = None
                st.experimental_rerun()
    
    return None

def audio_player(audio_bytes):
    """Display audio player for TTS playback"""
    if audio_bytes:
        st.audio(audio_bytes, format='audio/mp3')
