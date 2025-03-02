#!/bin/bash
# Script to install missing dependencies

echo "Installing missing dependencies..."

# Install sentence-transformers
pip install sentence-transformers

# Other potentially missing packages
pip install fastapi uvicorn pydantic

# Check for required dependencies
echo "Checking for key dependencies..."
python -c "import openai; print('✅ openai')" || echo "❌ openai missing"
python -c "import fastapi; print('✅ fastapi')" || echo "❌ fastapi missing"
python -c "import uvicorn; print('✅ uvicorn')" || echo "❌ uvicorn missing"
python -c "import whisper; print('✅ whisper')" || echo "❌ whisper missing"
python -c "import sentence_transformers; print('✅ sentence_transformers')" || echo "❌ sentence_transformers missing"
python -c "from youtube_transcript_api import YouTubeTranscriptApi; print('✅ youtube_transcript_api')" || echo "❌ youtube_transcript_api missing"

echo "Installation completed. You can now try running the backend server again."
