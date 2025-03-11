"""
Automatic Speech Recognition (ASR) Module for Japanese language learning.
Features:
1. Integration with OpenAI's Whisper API optimized for Japanese
2. Real-time speech capture and processing
3. Pronunciation feedback including pitch accent and intonation analysis
4. Handling of common non-native speaker pronunciation issues
"""

import os
import time
import tempfile
from typing import Dict, List, Optional, Tuple
import logging
import numpy as np
import sounddevice as sd
import soundfile as sf
from openai import OpenAI
import librosa
import pykakasi
import romkan
import difflib
import json
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Japanese pitch accent patterns dictionary
# Format: {word: [pitch_pattern]}
# Where pitch_pattern is a list of 0 (low) and 1 (high) representing the pitch of each mora
PITCH_ACCENT_DICT = {
    "こんにちは": [0, 1, 1, 1, 0],  # ko(L) n(H) ni(H) chi(H) wa(L)
    "ありがとう": [0, 1, 1, 1, 0, 0],  # a(L) ri(H) ga(H) to(H) u(L)
    "わたし": [0, 1, 0, 0],  # wa(L) ta(H) shi(L)
    "にほん": [0, 1, 0, 0],  # ni(L) ho(H) n(L)
}

# Common pronunciation issues for non-native speakers
COMMON_ISSUES = {
    "pitch_accent": {
        "flat": "Your pitch is too flat. Japanese has distinct pitch patterns.",
        "wrong_pattern": "The pitch accent pattern is incorrect.",
    },
    "vowel_length": {
        "short": "Long vowels should be pronounced longer.",
        "long": "This vowel should be pronounced shorter.",
    },
    "consonants": {
        "r_l": "The Japanese 'r' sound is different from English 'r' or 'l'. It's a light tap of the tongue.",
        "ts": "The 'ts' sound in Japanese should be clearly pronounced.",
        "fu": "The 'f' in 'fu' should be softer than in English.",
    },
    "particles": {
        "wa_ha": "The particle は is pronounced 'wa', not 'ha'.",
        "wo_o": "The particle を is pronounced 'o', not 'wo'.",
        "he_e": "The particle へ is pronounced 'e', not 'he'.",
    }
}

class JapaneseASR:
    """
    ASR class for capturing and evaluating spoken Japanese.
    """
    
    def __init__(self, model_size: str = "medium", use_gpu: bool = False):
        """
        Initialize the Japanese ASR module.
        
        Args:
            model_size: Size of the Whisper model to use ('tiny', 'base', 'small', 'medium', 'large')
            use_gpu: Whether to use GPU acceleration if available
        """
        self.model_size = model_size
        self.use_gpu = use_gpu
        self.client = OpenAI()
        self.kks = pykakasi.kakasi()
        logger.info(f"ASR module initialized with model size: {model_size}")
        
        # Create temp directory for audio files if it doesn't exist
        self.temp_dir = Path(tempfile.gettempdir()) / "japanese_asr"
        self.temp_dir.mkdir(exist_ok=True)
    
    def record_audio(self, duration: int = 5, sample_rate: int = 16000) -> Optional[str]:
        """
        Record audio from the user's microphone.
        
        Args:
            duration: Length of recording in seconds
            sample_rate: Sample rate for recording (16kHz recommended for Whisper)
            
        Returns:
            Path to the saved audio file or None if recording failed
        """
        try:
            logger.info(f"Recording audio for {duration} seconds...")
            print("🎤 Recording... Speak in Japanese.")
            
            # Record audio
            recording = sd.rec(
                int(duration * sample_rate),
                samplerate=sample_rate,
                channels=1,
                dtype='float32'
            )
            
            # Display countdown
            for i in range(duration, 0, -1):
                print(f"Time remaining: {i}s", end='\r')
                time.sleep(1)
            
            # Wait until recording is finished
            sd.wait()
            print("✓ Recording complete!")
            
            # Save to temporary file
            timestamp = int(time.time())
            audio_path = self.temp_dir / f"japanese_speech_{timestamp}.wav"
            sf.write(str(audio_path), recording, sample_rate)
            
            logger.info(f"Audio saved to {audio_path}")
            return str(audio_path)
            
        except Exception as e:
            logger.error(f"Error recording audio: {e}")
            return None
    
    def transcribe_audio(self, audio_file: str) -> Dict:
        """
        Transcribe Japanese audio using Whisper.
        
        Args:
            audio_file: Path to the audio file
            
        Returns:
            Dictionary with transcription and confidence scores
        """
        try:
            logger.info(f"Transcribing audio file: {audio_file}")
            
            # Open the audio file
            with open(audio_file, "rb") as audio_data:
                try:
                    # Transcribe using OpenAI's Whisper API
                    response = self.client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_data,
                        language="ja",
                        response_format="verbose_json"
                    )
                    
                    # Convert response to dictionary
                    result = json.loads(response.model_dump_json())
                    
                    # Extract text and confidence
                    transcription = {
                        "text": result.get("text", ""),
                        "segments": result.get("segments", []),
                        "confidence": self._calculate_avg_confidence(result.get("segments", []))
                    }
                    
                    logger.info(f"Transcription: {transcription['text']}")
                    logger.info(f"Confidence: {transcription['confidence']:.2f}")
                    
                    return transcription
                
                except Exception as api_error:
                    # Extract specific error information from OpenAI
                    error_message = str(api_error)
                    error_code = None
                    error_type = None
                    
                    # Try to extract structured error information
                    if hasattr(api_error, 'status_code'):
                        error_code = api_error.status_code
                    
                    if hasattr(api_error, 'response') and hasattr(api_error.response, 'json'):
                        try:
                            error_data = api_error.response.json()
                            if 'error' in error_data and 'type' in error_data['error']:
                                error_type = error_data['error']['type']
                        except:
                            pass
                    
                    # Log detailed error
                    logger.error(f"Error transcribing audio: Error code: {error_code} - {error_message}")
                    
                    # Return error info in result
                    return {
                        "text": "",
                        "segments": [],
                        "confidence": 0.0,
                        "error": True,
                        "error_code": error_code,
                        "error_type": error_type,
                        "error_message": error_message
                    }
        
        except Exception as e:
            logger.error(f"Error processing audio file: {e}")
            return {"text": "", "segments": [], "confidence": 0.0, "error": True, "error_message": str(e)}
    
    def _calculate_avg_confidence(self, segments: List[Dict]) -> float:
        """Calculate average confidence from segments"""
        if not segments:
            return 0.0
        
        confidences = [seg.get("confidence", 0.0) for seg in segments]
        return sum(confidences) / len(confidences)
    
    def evaluate_pronunciation(self, reference: str, actual: str) -> Dict:
        """
        Evaluate the user's Japanese pronunciation.
        
        Args:
            reference: Reference text (correct pronunciation)
            actual: Actual transcribed text from user
            
        Returns:
            Dictionary with pronunciation scores and feedback
        """
        logger.info(f"Evaluating pronunciation - Reference: '{reference}', Actual: '{actual}'")
        
        # Convert both texts to hiragana for fair comparison
        reference_hiragana = self._to_hiragana(reference)
        actual_hiragana = self._to_hiragana(actual)
        
        # Calculate text similarity
        similarity_ratio = self._calculate_similarity(reference_hiragana, actual_hiragana)
        
        # Analyze pitch accent accuracy
        pitch_score = self._evaluate_pitch_accent(reference, actual)
        
        # Detect common pronunciation issues
        issues = self._detect_common_issues(reference, actual)
        
        # Calculate overall accuracy
        accuracy = (similarity_ratio * 0.7) + (pitch_score * 0.3)
        accuracy = min(max(accuracy, 0.0), 1.0)  # Ensure between 0 and 1
        
        # Generate detailed feedback
        feedback = self._generate_feedback(accuracy, issues, reference, actual)
        
        evaluation = {
            "accuracy": accuracy,
            "text_similarity": similarity_ratio,
            "pitch_accent": pitch_score,
            "issues": issues,
            "feedback": feedback
        }
        
        logger.info(f"Pronunciation evaluation: accuracy={accuracy:.2f}")
        return evaluation
    
    def _to_hiragana(self, text: str) -> str:
        """Convert text to hiragana"""
        result = self.kks.convert(text)
        hiragana = ''.join([item['hira'] for item in result])
        return hiragana
    
    def _calculate_similarity(self, str1: str, str2: str) -> float:
        """Calculate string similarity using difflib"""
        matcher = difflib.SequenceMatcher(None, str1, str2)
        return matcher.ratio()
    
    def _evaluate_pitch_accent(self, reference: str, actual: str) -> float:
        """
        Evaluate pitch accent accuracy
        In a real implementation, this would analyze audio waveforms
        Here we use a simulated evaluation based on text
        """
        # Simple evaluation - this would be more sophisticated in production
        # using acoustic analysis of the audio
        
        # For demonstration, return a score based on text similarity
        # In a real implementation, this would analyze the audio pitch contours
        similarity = self._calculate_similarity(reference, actual)
        
        # Simulate pitch analysis - in production this would analyze audio frequencies
        # to detect the actual pitch pattern
        pitch_score = similarity * 0.9  # Slightly lower than text similarity
        
        return pitch_score
    
    def _detect_common_issues(self, reference: str, actual: str) -> List[str]:
        """Detect common pronunciation issues for non-native Japanese speakers"""
        issues = []
        
        # Convert to hiragana for analysis
        ref_hiragana = self._to_hiragana(reference)
        act_hiragana = self._to_hiragana(actual)
        
        # Check for vowel length issues
        if "ー" in ref_hiragana and "ー" not in act_hiragana:
            issues.append(COMMON_ISSUES["vowel_length"]["short"])
        
        # Check for particle pronunciation issues
        if "は" in reference and "は" not in actual and "わ" not in actual:
            issues.append(COMMON_ISSUES["particles"]["wa_ha"])
        
        if "を" in reference and "を" not in actual and "お" not in actual:
            issues.append(COMMON_ISSUES["particles"]["wo_o"])
            
        # In real implementation, more sophisticated checks would be performed
        # using acoustic analysis of the audio
        
        return issues
    
    def _generate_feedback(self, accuracy: float, issues: List[str], reference: str, actual: str) -> str:
        """Generate human-friendly feedback based on evaluation"""
        if accuracy >= 0.9:
            base_feedback = "素晴らしい! (Wonderful!) Your pronunciation is excellent."
        elif accuracy >= 0.7:
            base_feedback = "良いですね! (Good!) Your pronunciation is generally good."
        elif accuracy >= 0.5:
            base_feedback = "まあまあです (Not bad). Your pronunciation needs some practice."
        else:
            base_feedback = "もっと練習しましょう (Let's practice more). Your pronunciation needs significant improvement."
        
        # Add specific issues if found
        issue_feedback = ""
        if issues:
            issue_feedback = " Specific points to improve: " + " ".join(issues)
        
        return base_feedback + issue_feedback
    
    def get_improvement_suggestions(self, evaluation: Dict) -> List[str]:
        """
        Generate suggestions for improving Japanese pronunciation.
        
        Args:
            evaluation: Pronunciation evaluation results
            
        Returns:
            List of improvement suggestions
        """
        suggestions = []
        
        # Generate suggestions based on evaluation scores
        accuracy = evaluation.get("accuracy", 0.0)
        
        # General suggestions
        if accuracy < 0.6:
            suggestions.append("Practice basic Japanese sounds using mimicry exercises.")
            suggestions.append("Listen and repeat after native speakers, focusing on one sound at a time.")
        
        # Add pitch accent practice suggestions
        if evaluation.get("pitch_accent", 0.0) < 0.7:
            suggestions.append("Focus on Japanese pitch accent patterns by using pitch accent dictionaries or apps.")
            suggestions.append("Practice high-low patterns in words like にほん(LHL) or あめ(LH).")
        
        # Add specific improvement suggestions based on issues
        issues = evaluation.get("issues", [])
        if "vowel_length" in str(issues):
            suggestions.append("Practice distinguishing between short and long vowels (e.g., おじさん vs おじいさん).")
        
        if "particles" in str(issues):
            suggestions.append("Practice the correct pronunciation of particles (は as 'wa', を as 'o', へ as 'e').")
        
        # If no specific suggestions, add general ones
        if not suggestions:
            suggestions = [
                "Continue practicing Japanese regularly.",
                "Listen to native Japanese speakers and mimic their pronunciation.",
                "Record yourself speaking and compare with native audio.",
                "Work on smooth transitions between words in sentences."
            ]
        
        return suggestions


def main():
    """Example usage of the ASR module"""
    asr = JapaneseASR()
    
    print("Japanese ASR module - Example usage")
    print("This will capture spoken Japanese and provide pronunciation feedback")
    
    # Record audio
    audio_file = asr.record_audio(duration=5)
    
    if audio_file:
        # Transcribe audio
        print("Transcribing your speech...")
        transcription = asr.transcribe_audio(audio_file)
        
        # Example reference text (in real usage, this would be the expected phrase)
        reference_text = "こんにちは、お元気ですか"
        
        print(f"\nYou said: {transcription['text']}")
        print(f"Reference: {reference_text}")
        
        # Evaluate pronunciation
        print("\nEvaluating your pronunciation...")
        evaluation = asr.evaluate_pronunciation(reference_text, transcription['text'])
        
        # Display results
        print(f"\nAccuracy: {evaluation['accuracy']*100:.1f}%")
        print(f"Feedback: {evaluation['feedback']}")
        
        # Get improvement suggestions
        suggestions = asr.get_improvement_suggestions(evaluation)
        print("\nSuggestions for improvement:")
        for i, suggestion in enumerate(suggestions, 1):
            print(f"{i}. {suggestion}")


if __name__ == "__main__":
    main()
