"""
Pronunciation practice page for the Japanese Listening Comprehension App.
This page allows users to record their pronunciation and receive feedback.
"""

import sys
import os
import streamlit as st
import time
from pathlib import Path

# Add backend to path for imports
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path.absolute()) not in sys.path:
    sys.path.append(str(backend_path.absolute()))

# Check for required dependencies and handle import errors gracefully
required_packages = ['soundfile', 'sounddevice', 'librosa', 'pykakasi', 'romkan', 'openai']
missing_packages = []

for package in required_packages:
    try:
        __import__(package)
    except ImportError:
        missing_packages.append(package)

# Import ASR module if dependencies are met
if not missing_packages:
    try:
        from speech.asr_module import JapaneseASR
        ASR_AVAILABLE = True
    except ImportError as e:
        st.error(f"Error importing ASR module: {e}")
        ASR_AVAILABLE = False
else:
    ASR_AVAILABLE = False

# Page configuration
st.set_page_config(
    page_title="Japanese Pronunciation Practice",
    page_icon="🎤",
    layout="wide"
)

def main():
    st.title("🇯🇵 Japanese Pronunciation Practice")
    
    # Check if required packages are available
    if missing_packages:
        st.error(f"📦 Missing required packages: {', '.join(missing_packages)}")
        st.info("""
        ### Please install the missing dependencies:
        
        Run the following command in your terminal:
        ```
        pip install {0}
        ```
        
        Or install all requirements at once:
        ```
        pip install -r frontend/requirements.txt
        ```
        """.format(' '.join(missing_packages)))
        
        # Add installation button for convenience
        if st.button("📝 Show Installation Commands"):
            st.code(f"pip install {' '.join(missing_packages)}")
            st.code("pip install -r frontend/requirements.txt")
        
        # Early return to avoid running the rest of the app
        return
    
    if not ASR_AVAILABLE:
        st.error("ASR module could not be loaded. Please check the installation and try again.")
        return
    
    st.markdown("""
    ### Improve your Japanese pronunciation with AI feedback
    Record yourself speaking Japanese and get instant feedback on your pronunciation,
    including pitch accent and intonation analysis.
    """)
    
    # Initialize session state for ASR if not exists
    if 'asr' not in st.session_state:
        with st.spinner("Initializing speech recognition..."):
            try:
                st.session_state.asr = JapaneseASR()
            except Exception as e:
                st.error(f"Error initializing ASR: {e}")
                return
    
    # Create tabs for different practice modes
    tab1, tab2 = st.tabs(["🎯 Guided Practice", "🆓 Free Practice"])
    
    with tab1:
        guided_practice()
        
    with tab2:
        free_practice()
    
    # Add information about the feature
    st.sidebar.header("About this feature")
    st.sidebar.info("""
    This feature uses OpenAI's Whisper model optimized for Japanese to analyze your pronunciation.
    
    The system evaluates:
    - Pronunciation accuracy
    - Pitch accent patterns
    - Common mistakes made by non-native speakers
    
    Practice regularly to improve your Japanese speaking skills!
    """)
    
    # Add example phrases
    st.sidebar.header("Example Phrases")
    example_phrases = {
        "Beginner (N5)": [
            "こんにちは。", 
            "わたしの なまえは ________ です。",
            "ありがとうございます。",
            "すみません、トイレはどこですか？"
        ],
        "Intermediate (N4-N3)": [
            "昨日、友達と映画を見に行きました。",
            "日本語の勉強は難しいですが、楽しいです。",
            "明日の天気はどうなるでしょうか？"
        ],
        "Advanced (N2-N1)": [
            "環境問題に関して議論することは非常に重要だと思います。",
            "その映画は予想以上に感動的で、思わず涙が出てしまいました。",
            "新しい技術の開発によって、私たちの生活はどのように変わるでしょうか。"
        ]
    }
    
    for level, phrases in example_phrases.items():
        st.sidebar.subheader(level)
        for phrase in phrases:
            st.sidebar.markdown(f"• {phrase}")

def guided_practice():
    """Guided pronunciation practice with predefined phrases"""
    st.header("Guided Practice")
    
    # Predefined practice phrases with translations and JLPT levels
    practice_sets = [
        {
            "japanese": "こんにちは。",
            "english": "Hello.",
            "level": "N5",
            "notes": "Standard greeting for daytime"
        },
        {
            "japanese": "はじめまして。どうぞよろしくお願いします。",
            "english": "Nice to meet you. Please treat me well.",
            "level": "N5",
            "notes": "Used when meeting someone for the first time"
        },
        {
            "japanese": "昨日、新しい映画を見ました。とても面白かったです。",
            "english": "Yesterday, I watched a new movie. It was very interesting.",
            "level": "N4",
            "notes": "Past tense with adjective"
        },
        {
            "japanese": "週末に友達と買い物に行くつもりです。",
            "english": "I'm planning to go shopping with my friends on the weekend.",
            "level": "N4",
            "notes": "Using つもり for expressing intention"
        },
        {
            "japanese": "日本語の発音は難しいですが、毎日練習すれば上手になると思います。",
            "english": "Japanese pronunciation is difficult, but I think if you practice every day, you will improve.",
            "level": "N3",
            "notes": "Conditional form ～ば"
        }
    ]
    
    # Let user select a practice phrase
    selected_level = st.selectbox(
        "Select JLPT level:",
        ["N5", "N4", "N3", "N2", "N1", "All Levels"],
        index=0
    )
    
    # Filter phrases by level if needed
    if selected_level != "All Levels":
        filtered_phrases = [p for p in practice_sets if p["level"] == selected_level]
    else:
        filtered_phrases = practice_sets
    
    if not filtered_phrases:
        st.warning(f"No practice phrases available for {selected_level}. Try another level.")
        return
        
    # Select phrase
    phrase_idx = st.selectbox(
        "Select a phrase to practice:",
        range(len(filtered_phrases)),
        format_func=lambda i: f"{filtered_phrases[i]['japanese']} ({filtered_phrases[i]['level']})"
    )
    
    current_phrase = filtered_phrases[phrase_idx]
    
    # Display the phrase and translation
    st.subheader("Practice this phrase:")
    st.markdown(f"### {current_phrase['japanese']}")
    st.markdown(f"*{current_phrase['english']}*")
    
    if "notes" in current_phrase and current_phrase["notes"]:
        st.info(f"**Note:** {current_phrase['notes']}")  # Fixed quotes in f-string
    
    # Record and evaluate
    if record_and_evaluate(current_phrase['japanese']):
        # Offer to try another phrase
        st.success("Great job! Try another phrase to continue practicing.")

def free_practice():
    """Free-form pronunciation practice with user input"""
    st.header("Free Practice")
    st.write("Enter any Japanese text you'd like to practice pronouncing:")
    
    # Text input for custom Japanese
    custom_text = st.text_area(
        "Enter Japanese text:",
        value="こんにちは、元気ですか？",
        height=100,
        max_chars=500
    )
    
    if st.button("Translate to English", key="translate_btn"):
        # In a real implementation, this would call a translation API
        st.info("Translation feature will be implemented in the future. For now, please use an external translation service.")
    
    # Record and evaluate
    record_and_evaluate(custom_text)

def record_and_evaluate(reference_text):
    """Record user's voice and evaluate pronunciation"""
    col1, col2 = st.columns([1, 1])
    
    with col1:
        # Recording duration - add a unique key based on the reference text
        duration = st.slider(
            "Recording duration (seconds):", 
            3, 10, 5, 
            key=f"duration_slider_{hash(reference_text)}"
        )
        
        # Record button - already has a unique key
        record_clicked = st.button("🎤 Record", key=f"record_{hash(reference_text)}")
        
        if record_clicked:
            # Show recording progress
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            for i in range(duration):
                # Update progress bar and text
                progress_bar.progress((i + 1) / duration)
                status_text.text(f"Recording: {i + 1}/{duration} seconds")
                time.sleep(1)
            
            status_text.text("Processing your speech...")
            
            # Record audio using the ASR module
            audio_file = st.session_state.asr.record_audio(duration=duration)
            
            if audio_file:
                # Transcribe the audio
                transcription = st.session_state.asr.transcribe_audio(audio_file)
                
                # Check for API errors
                if transcription.get("error", False):
                    error_message = transcription.get("error_message", "Unknown error")
                    error_type = transcription.get("error_type", "")
                    error_code = transcription.get("error_code", "")
                    
                    if "insufficient_quota" in error_message or "insufficient_quota" == error_type:
                        st.error("📢 **OpenAI API Quota Exceeded**")
                        st.warning("""
                        Your OpenAI API quota has been exceeded. You can:
                        
                        1. Check your OpenAI billing settings and upgrade your plan
                        2. Create a new API key with available quota
                        3. Try again later when your quota resets
                        
                        Your audio was recorded successfully but couldn't be transcribed.
                        """)
                        
                        # Provide option to download the audio file
                        with open(audio_file, "rb") as f:
                            audio_bytes = f.read()
                            st.download_button(
                                label="Download your recording",
                                data=audio_bytes,
                                file_name="japanese_recording.wav",
                                mime="audio/wav",
                                key=f"download_{hash(reference_text)}"
                            )
                        
                        # Play the audio
                        st.audio(audio_bytes, format="audio/wav")
                        return False
                    else:
                        st.error(f"Transcription failed: {error_message} (Error code: {error_code})")
                        return False
                
                # Store results in session state
                st.session_state.last_transcription = transcription
                st.session_state.last_reference = reference_text
                
                # Evaluate pronunciation
                evaluation = st.session_state.asr.evaluate_pronunciation(
                    reference_text, 
                    transcription["text"]
                )
                st.session_state.last_evaluation = evaluation
                
                # Get improvement suggestions
                suggestions = st.session_state.asr.get_improvement_suggestions(evaluation)
                st.session_state.last_suggestions = suggestions
                
                # Mark as complete to refresh the page and show results
                st.session_state.recording_complete = True
                st.rerun()  # Use st.rerun instead of experimental_rerun
            else:
                st.error("Failed to record audio. Please check your microphone and try again.")
    
    # Display results if available
    if hasattr(st.session_state, 'recording_complete') and st.session_state.recording_complete:
        with col2:
            st.subheader("Results:")
            
            transcription = st.session_state.last_transcription
            evaluation = st.session_state.last_evaluation
            suggestions = st.session_state.last_suggestions
            
            st.markdown("**You said:**")
            st.text(transcription["text"])
            
            st.markdown("**Reference text:**")
            st.text(st.session_state.last_reference)
            
            # Display accuracy with color coding
            accuracy = evaluation["accuracy"] * 100
            if accuracy >= 80:
                st.success(f"Accuracy: {accuracy:.1f}%")
            elif accuracy >= 60:
                st.warning(f"Accuracy: {accuracy:.1f}%")
            else:
                st.error(f"Accuracy: {accuracy:.1f}%")
            
            # Display feedback
            st.markdown("**Feedback:**")
            st.info(evaluation["feedback"])
            
            # Display suggestions
            st.markdown("**Suggestions for improvement:**")
            for i, suggestion in enumerate(suggestions, 1):
                st.write(f"{i}. {suggestion}")
                
            # Reset for next recording
            st.session_state.recording_complete = False
            
            return True
    
    return False

if __name__ == "__main__":
    main()
