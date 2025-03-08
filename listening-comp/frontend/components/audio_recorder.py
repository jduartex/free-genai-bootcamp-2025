import streamlit as st
import numpy as np
import io
import tempfile
from pathlib import Path
from datetime import datetime
import uuid

# Let's create a simpler audio recording solution using Streamlit's file uploader
# This avoids the problematic webrtc component that's causing duplicate key errors

def audio_recorder(key_prefix=""):
    """
    Display a simple audio recording interface using file upload as fallback.
    Returns the uploaded/recorded audio file when available.
    
    Args:
        key_prefix: Optional prefix to add to widget keys for uniqueness
    """
    # Generate a unique identifier for this specific instance of audio_recorder
    instance_id = key_prefix + "_" + str(uuid.uuid4())
    
    # Use instance-specific keys for session state
    recording_complete_key = f"audio_recording_complete_{instance_id}"
    recorded_audio_key = f"recorded_audio_{instance_id}"
    session_id_key = f"session_id_{instance_id}"
    
    # Session state to track recording status
    if recording_complete_key not in st.session_state:
        st.session_state[recording_complete_key] = False
        
    if recorded_audio_key not in st.session_state:
        st.session_state[recorded_audio_key] = None
    
    # Create a unique key for this session if not exists
    if session_id_key not in st.session_state:
        st.session_state[session_id_key] = str(uuid.uuid4())
    
    col1, col2 = st.columns([3, 1])
    
    with col1:
        # Only show the uploader if we don't have a recording yet
        if not st.session_state[recording_complete_key]:
            st.markdown("### Upload an audio recording")
            st.markdown("Please record your answer using your device's recording app, then upload the file:")
            
            # File uploader for audio files with unique key
            audio_file = st.file_uploader(
                "Upload audio", 
                type=["wav", "mp3", "m4a", "ogg"], 
                key=f"audio_upload_{instance_id}"
            )
            
            if audio_file is not None:
                # Save the uploaded audio to session state
                audio_bytes = audio_file.read()
                
                # Preview the audio
                st.audio(audio_bytes, key=f"audio_preview_{instance_id}")
                st.success("Audio uploaded successfully!")
                
                # Save to session state
                st.session_state[recorded_audio_key] = audio_bytes
                st.session_state[recording_complete_key] = True
                
                # Create a file-like object for API consumption
                audio_io = io.BytesIO(audio_bytes)
                audio_io.name = audio_file.name
                
                return audio_io
        else:
            # Show the recorded audio playback
            if st.session_state[recorded_audio_key]:
                st.markdown("### Your recording")
                st.audio(st.session_state[recorded_audio_key], key=f"audio_playback_{instance_id}")
    
    with col2:
        # Reset button
        if st.session_state[recording_complete_key]:
            if st.button("Upload Different File", key=f"reset_audio_{instance_id}"):
                st.session_state[recording_complete_key] = False
                st.session_state[recorded_audio_key] = None
                # Generate a new session ID for the next recording
                st.session_state[session_id_key] = str(uuid.uuid4())
                st.experimental_rerun()
    
    # Provide alternative method for devices with microphones
    if not st.session_state[recording_complete_key]:
        st.markdown("---")
        st.markdown("### Or record directly in your browser")
        st.markdown("Click the button below to record audio directly in your browser:")
        
        # HTML/JavaScript for in-browser recording with unique ID
        recorder_id = f"recorder_{instance_id}".replace("-", "_")
        record_button_html = f"""
        <script>
        // Unique recorder instance for {recorder_id}
        let mediaRecorder_{recorder_id};
        let audioChunks_{recorder_id} = [];
        let isRecording_{recorder_id} = false;
        
        function toggleRecording_{recorder_id}() {{
            const buttonEl = document.getElementById('record-button-{recorder_id}');
            const statusEl = document.getElementById('recording-status-{recorder_id}');
            
            if (!isRecording_{recorder_id}) {{
                // Start recording
                navigator.mediaDevices.getUserMedia({{ audio: true }})
                    .then(stream => {{
                        mediaRecorder_{recorder_id} = new MediaRecorder(stream);
                        mediaRecorder_{recorder_id}.ondataavailable = (e) => {{
                            audioChunks_{recorder_id}.push(e.data);
                        }};
                        
                        mediaRecorder_{recorder_id}.onstop = () => {{
                            const audioBlob = new Blob(audioChunks_{recorder_id}, {{ type: 'audio/wav' }});
                            const audioUrl = URL.createObjectURL(audioBlob);
                            const audio = document.createElement('audio');
                            audio.controls = true;
                            audio.src = audioUrl;
                            
                            const recordingContainerEl = document.getElementById('recording-container-{recorder_id}');
                            recordingContainerEl.innerHTML = '';
                            recordingContainerEl.appendChild(audio);
                            
                            // Create a download link
                            const link = document.createElement('a');
                            link.href = audioUrl;
                            link.download = 'recording.wav';
                            link.innerHTML = 'Download and upload the recording';
                            link.style.display = 'block';
                            link.style.margin = '10px 0';
                            recordingContainerEl.appendChild(link);
                            
                            buttonEl.textContent = 'Record Again';
                            statusEl.textContent = 'Recording complete! Download and upload the file above.';
                        }};
                        
                        audioChunks_{recorder_id} = [];
                        mediaRecorder_{recorder_id}.start();
                        isRecording_{recorder_id} = true;
                        buttonEl.textContent = 'Stop Recording';
                        statusEl.textContent = '🔴 Recording... Click again to stop';
                    }});
            }} else {{
                // Stop recording
                mediaRecorder_{recorder_id}.stop();
                isRecording_{recorder_id} = false;
            }}
        }}
        </script>
        
        <button id="record-button-{recorder_id}" onclick="toggleRecording_{recorder_id}()" style="padding: 10px 20px; background-color: #ff4b4b; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Start Recording
        </button>
        <p id="recording-status-{recorder_id}"></p>
        <div id="recording-container-{recorder_id}"></div>
        """
        
        st.components.v1.html(record_button_html, height=200)
    
    return None

def audio_player(audio_bytes, key_prefix=""):
    """
    Display audio player for TTS playback
    
    Args:
        audio_bytes: Audio data to play
        key_prefix: Optional prefix for widget key uniqueness
    """
    if audio_bytes:
        unique_key = f"audio_player_{key_prefix}_{str(uuid.uuid4())}"
        st.audio(audio_bytes, format='audio/mp3', key=unique_key)
