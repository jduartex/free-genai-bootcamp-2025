"""
Initialize required directories and files for the backend server.
Run this script once before starting the server.
"""

import os
from pathlib import Path

def initialize_directories():
    """Create necessary directories for the backend."""
    # Create static/audio directory
    static_audio_dir = Path(__file__).parent / "static" / "audio"
    os.makedirs(static_audio_dir, exist_ok=True)
    
    print(f"Created directory: {static_audio_dir}")
    
    # Create a simple fallback audio file
    fallback_file = static_audio_dir / "tts_fallback.mp3"
    if not fallback_file.exists():
        # This is a minimal valid MP3 file (essentially silence)
        mp3_header = bytes([
            0xFF, 0xFB, 0x90, 0x44, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ])
        
        with open(fallback_file, 'wb') as f:
            f.write(mp3_header * 100)  # Repeat to make it audible
            
        print(f"Created fallback audio file: {fallback_file}")

if __name__ == "__main__":
    initialize_directories()
    print("Initialization complete.")
