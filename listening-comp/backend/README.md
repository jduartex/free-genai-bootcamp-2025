# Japanese Listening Comprehension App - Backend

This is the backend component of the Japanese Listening Comprehension application. It provides API endpoints and processing services for Japanese language learning features.

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

## Prerequisites

Before running the backend or validation scripts:

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables - create a `.env` file with:
```
OPENAI_API_KEY=your_openai_key
AWS_ACCESS_KEY_ID=your_aws_key  # If using Amazon Polly
AWS_SECRET_ACCESS_KEY=your_aws_secret  # If using Amazon Polly
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json  # If using Google TTS
```

3. Install FFmpeg (required for audio processing):
   - On macOS: `brew install ffmpeg`
   - On Ubuntu/Debian: `sudo apt-get install ffmpeg`
   - On Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html)

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

## Running the Backend Validation Script

The validation script checks all backend components for proper configuration and functionality.

### Option 1: From the backend directory

```bash
# Navigate to backend directory
cd /Users/jduarte/Documents/GenAIBootcamp/free-genai-bootcamp-2025/listening-comp/backend

# Make script executable (Unix/Linux/macOS only)
chmod +x validate.py

# Run the validation script
./validate.py
```

### Option 2: Using Python directly

```bash
# From the backend directory
python validate.py

# OR from the project root
python backend/validate.py
```

## Validation Components

The script validates:

1. **Text-to-Speech Services**
   - AWS Polly with Japanese voices
   - Google TTS with Japanese voices

2. **YouTube Transcript API**
   - Japanese transcript fetching
   - Transcript processing

3. **Database**
   - SQLite vector extension
   - Database schema creation

4. **API Endpoints**
   - Presence of Flask routes
   - API configuration

5. **OpenAI Integration**
   - API key validation
   - Basic API call test

6. **FFmpeg Installation**
   - Version check

## Troubleshooting

If validation fails, check:

1. API keys in your `.env` file
2. Network connectivity for API services
3. FFmpeg installation
4. Python dependencies are correctly installed
5. SQLite vector extension installation

For specific component failures, refer to the detailed error messages provided by the validation script.

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

## Text-to-Speech Configuration

### AWS Polly
The application uses specific Japanese voices for AWS Polly:

1. **Standard Engine Voices**:
   - Takumi (male voice)
   - Mizuki (female voice)

2. **Neural Engine Voices** (higher quality):
   - Kazuha (female voice) - Requires neural engine and specific regions

Note: Neural voices like Kazuha are only available in certain AWS regions:
- us-east-1 (N. Virginia)
- us-west-2 (Oregon)
- ap-northeast-1 (Tokyo)

If you encounter errors with Kazuha, try setting your AWS_REGION to one of these regions in your .env file.

### Google TTS
To use Google Text-to-Speech:

1. Create a service account in Google Cloud Console
2. Enable the Text-to-Speech API for your project
3. Download the JSON credentials file
4. Set the path to this file in your .env:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/your/credentials.json
   ```

Note: The path must be an absolute path to the JSON file, not a relative path.

## Troubleshooting

### AWS Polly Issues
- **"Voice not available"**: Some voices are only available in certain regions. Try changing your AWS_REGION.
- **"This voice does not support the selected engine"**: Neural voices like Kazuha require the neural engine to be specified.

### Google TTS Issues
- **"File not found"**: Make sure you've replaced the placeholder path with your actual credentials file path.
- **Authentication errors**: Ensure your service account has the Text-to-Speech API enabled and the credentials are valid.
