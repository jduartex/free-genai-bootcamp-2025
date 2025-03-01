import os
import asyncio
from typing import Dict, Any, Optional
import logging
from dotenv import load_dotenv
import tempfile
import subprocess
import json
import time
import base64
from typing import Dict, Any, Optional, Union, Tuple, List
import numpy as np
import openai
from pydub import AudioSegment
import whisper

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize OpenAI client
openai_api_key = os.getenv("OPENAI_API_KEY")
if openai_api_key:
    openai.api_key = openai_api_key

class JapaneseSpeechRecognition:
    """Class for handling Japanese speech recognition with OpenAI Whisper."""
    
    def __init__(self, use_local_model: bool = False, model_name: str = "medium"):
        """
        Initialize the speech recognition system.
        
        Args:
            use_local_model: Whether to use the local Whisper model (True) or the OpenAI API (False)
            model_name: Model size for local Whisper ('tiny', 'base', 'small', 'medium', 'large')
        """
        self.use_local_model = use_local_model
        self.model_name = model_name
        
        # Load the local model if specified
        if self.use_local_model:
            self.model = whisper.load_model(self.model_name)
        else:
            self.model = None
    
    def transcribe_audio_openai(self, audio_file_path: str) -> Dict[str, Any]:
        """
        Transcribe audio using OpenAI's Whisper API.
        
        Args:
            audio_file_path: Path to the audio file
            
        Returns:
            Dictionary with transcription results
        """
        try:
            with open(audio_file_path, "rb") as audio_file:
                response = openai.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="ja",
                    response_format="verbose_json",
                    timestamp_granularities=["word"]
                )
                
            # Convert the response to a dictionary
            if isinstance(response, dict):
                result = response
            else:
                # Handle the case where response might be an object with attributes
                result = {
                    "text": response.text if hasattr(response, "text") else "",
                    "segments": getattr(response, "segments", []),
                    "language": getattr(response, "language", "ja"),
                }
                
            return result
            
        except Exception as e:
            print(f"Error in OpenAI transcription: {str(e)}")
            return {"error": str(e)}
    
    def transcribe_audio_local(self, audio_file_path: str) -> Dict[str, Any]:
        """
        Transcribe audio using the local Whisper model.
        
        Args:
            audio_file_path: Path to the audio file
            
        Returns:
            Dictionary with transcription results
        """
        try:
            # Load audio and convert to the format expected by Whisper
            audio = whisper.load_audio(audio_file_path)
            audio = whisper.pad_or_trim(audio)
            
            # Make log-Mel spectrogram
            mel = whisper.log_mel_spectrogram(audio).to(self.model.device)
            
            # Detect language (we'll still tell it it's Japanese but this helps with model initialization)
            _, probs = self.model.detect_language(mel)
            detected_language = max(probs, key=probs.get)
            
            # Decode audio
            options = whisper.DecodingOptions(
                language="ja",  # Force Japanese language
                task="transcribe",
                fp16=False,
                without_timestamps=False
            )
            result = self.model.decode(mel, options)
            
            # Construct a response similar to the OpenAI API
            segments = []
            if hasattr(result, "segments"):
                segments = [
                    {
                        "id": i,
                        "start": segment.start,
                        "end": segment.end,
                        "text": segment.text,
                        "tokens": segment.tokens,
                        "confidence": float(segment.avg_logprob)
                    }
                    for i, segment in enumerate(result.segments)
                ]
            
            return {
                "text": result.text,
                "segments": segments,
                "language": detected_language,
                "confidence": float(np.exp(result.avg_logprob)) if hasattr(result, "avg_logprob") else None
            }
            
        except Exception as e:
            print(f"Error in local transcription: {str(e)}")
            return {"error": str(e)}
    
    def process_audio_data(self, audio_data: Union[str, bytes], file_format: str = "mp3") -> Dict[str, Any]:
        """
        Process audio data for transcription.
        
        Args:
            audio_data: Base64 encoded audio string or raw bytes
            file_format: Audio file format (mp3, wav, etc.)
            
        Returns:
            Transcription results
        """
        try:
            # Create a temporary file for the audio
            with tempfile.NamedTemporaryFile(suffix=f".{file_format}", delete=False) as temp_audio_file:
                temp_audio_path = temp_audio_file.name
                
                # Handle both base64 encoded strings and raw bytes
                if isinstance(audio_data, str):
                    # Assume it's base64 encoded
                    try:
                        decoded_audio = base64.b64decode(audio_data)
                        temp_audio_file.write(decoded_audio)
                    except Exception:
                        # If base64 decoding fails, assume it's a file path
                        if os.path.exists(audio_data):
                            with open(audio_data, "rb") as audio_file:
                                temp_audio_file.write(audio_file.read())
                        else:
                            raise ValueError(f"Invalid audio data. Not a valid base64 string or file path: {audio_data[:30]}...")
                else:
                    # Raw bytes
                    temp_audio_file.write(audio_data)
                
                temp_audio_file.flush()
            
            # Choose the transcription method based on configuration
            if self.use_local_model:
                result = self.transcribe_audio_local(temp_audio_path)
            else:
                result = self.transcribe_audio_openai(temp_audio_path)
            
            # Clean up the temporary file
            os.unlink(temp_audio_path)
            
            return result
            
        except Exception as e:
            print(f"Error processing audio: {str(e)}")
            return {"error": str(e)}
    
    def convert_audio_format(self, input_path: str, output_format: str = "mp3") -> str:
        """
        Convert audio to a format suitable for the ASR system.
        
        Args:
            input_path: Path to input audio file
            output_format: Desired output format
            
        Returns:
            Path to the converted audio file
        """
        try:
            # Create output filename
            output_path = os.path.splitext(input_path)[0] + f".{output_format}"
            
            # Load with pydub (handles various formats)
            audio = AudioSegment.from_file(input_path)
            
            # Export to new format
            audio.export(output_path, format=output_format)
            
            return output_path
            
        except Exception as e:
            print(f"Error converting audio format: {str(e)}")
            return input_path  # Return original path on error
    
    def get_pronunciation_confidence(self, transcription_result: Dict[str, Any]) -> float:
        """
        Extract pronunciation confidence score from transcription result.
        
        Args:
            transcription_result: Transcription result dictionary
            
        Returns:
            Confidence score between 0 and 1
        """
        # If we have a confidence score directly, use it
        if "confidence" in transcription_result and transcription_result["confidence"] is not None:
            return float(transcription_result["confidence"])
        
        # If we have segments with confidence, calculate average
        if "segments" in transcription_result and transcription_result["segments"]:
            segment_confidences = [
                seg.get("confidence", 0) 
                for seg in transcription_result["segments"]
                if isinstance(seg, dict) and "confidence" in seg
            ]
            
            if segment_confidences:
                return sum(segment_confidences) / len(segment_confidences)
        
        # Default moderate confidence when we can't determine
        return 0.5
    
    def transcribe_with_timestamps(self, audio_file_path: str) -> Dict[str, Any]:
        """
        Transcribe audio with detailed word-level timestamps.
        
        Args:
            audio_file_path: Path to audio file
            
        Returns:
            Transcription with word-level timing information
        """
        if self.use_local_model:
            # Local model doesn't support the same level of detailed timestamps
            # We'll use segment-level timestamps instead
            result = self.transcribe_audio_local(audio_file_path)
            # Add a note that these are segment-level timestamps only
            result["timestamp_level"] = "segment"
            return result
        else:
            try:
                with open(audio_file_path, "rb") as audio_file:
                    response = openai.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        language="ja",
                        response_format="verbose_json",
                        timestamp_granularities=["word", "segment"]
                    )
                
                if isinstance(response, dict):
                    result = response
                else:
                    # Convert object to dictionary
                    result = response.__dict__
                
                result["timestamp_level"] = "word"
                return result
                
            except Exception as e:
                print(f"Error getting detailed timestamps: {str(e)}")
                return {"error": str(e), "timestamp_level": "none"}


# Example usage
if __name__ == "__main__":
    # Example: Process an audio file
    asr = JapaneseSpeechRecognition(use_local_model=False)
    
    # Example file path - replace with an actual file for testing
    test_file = "path/to/japanese_audio_sample.mp3"
    
    if os.path.exists(test_file):
        print(f"Transcribing: {test_file}")
        result = asr.process_audio_data(test_file)
        print(f"Transcription: {result.get('text', 'No text')}")
        print(f"Language: {result.get('language', 'unknown')}")
        print(f"Confidence: {asr.get_pronunciation_confidence(result)}")
    else:
        print("Please provide a valid audio file path for testing")
