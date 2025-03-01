# Japanese Listening Comprehension App - Backend

This directory contains the backend components for the Japanese Listening Comprehension application. The backend handles transcript fetching, question generation, vector storage, and text-to-speech processing for Japanese language learning.

## Components

### 1. YouTube Transcript Fetcher
- Located in `transcript_fetcher.py`
- Fetches and processes Japanese transcripts from YouTube videos
- Handles timestamp alignment and text cleaning for Japanese content
- Supports extraction of captions with furigana when available

### 2. Vector Database
- Located in `vector_db.py`
- Implements SQLite with vector extension for Japanese text storage
- Manages embeddings for semantic search in Japanese
- Handles specialized indexing for kanji/kana variants

### 3. LLM Agent for Question Generation
- Located in `question_generator.py`
- Uses OpenAI APIs to generate comprehension questions from Japanese content
- Classifies content by JLPT level (N5-N1)
- Creates culturally appropriate questions with grammatical explanations

### 4. Text-to-Speech (TTS) Module
- Located in `tts_service.py`
- Implements both Amazon Polly and Google TTS for Japanese speech synthesis
- Optimized for correct pitch accent and natural Japanese pronunciation
- Configurable voice selection and speech parameters

### 5. ASR Module (Optional)
- Located in `speech_recognition.py`
- Uses Whisper for Japanese speech recognition
- Processes and evaluates user's spoken Japanese responses

## Setup Instructions

### Prerequisites
- Python 3.10 or higher
- API keys for OpenAI, AWS (optional), and Google Cloud (optional)
- SQLite database
- FFmpeg (required for audio processing)

### Mac-specific Setup
1. Install Homebrew if not already installed:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. Install FFmpeg using Homebrew:
   ```bash
   brew install ffmpeg
   ```

3. If you plan to use speech recognition, ensure your Mac's microphone permissions are enabled in System Preferences > Security & Privacy > Privacy > Microphone

### Environment Setup
1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the backend directory with your API keys:
   ```
   OPENAI_API_KEY=your_openai_key
   AWS_ACCESS_KEY_ID=your_aws_key  # If using Amazon Polly
   AWS_SECRET_ACCESS_KEY=your_aws_secret  # If using Amazon Polly
   GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json  # If using Google TTS
   ```

## API Reference

### Transcript Service
- `GET /api/transcript?video_id=<youtube_id>` - Fetch transcript for a YouTube video
- `POST /api/transcript/analyze` - Process and analyze transcript content

### Question Generation
- `POST /api/questions/generate` - Generate questions based on transcript
- `GET /api/questions?jlpt_level=<N1-N5>` - Get questions filtered by JLPT level

### Text-to-Speech
- `POST /api/tts` - Convert text to speech audio
- `GET /api/voices` - Get available Japanese voice options

### Speech Recognition (Optional)
- `POST /api/asr` - Process speech audio and return recognized text

## Development Guidelines

### Adding New Features
1. Create module in the appropriate directory
2. Update requirements if needed
3. Add tests in the `tests` directory
4. Document API endpoints and functions

### Running Tests
```bash
python -m pytest tests/
```

### Database Management
- Initialize the vector database:
  ```bash
  python scripts/init_db.py
  ```
- The database will be created at `data/transcript_db.sqlite`

## Integration with Frontend
The backend communicates with the Streamlit frontend via API calls. Ensure the backend server is running before starting the frontend application.

To start the backend server:
```bash
python run_backend.py
```

## Contributing
- Follow PEP 8 style guidelines
- Add type hints to all new functions
- Document all public APIs
- Write tests for new functionality
