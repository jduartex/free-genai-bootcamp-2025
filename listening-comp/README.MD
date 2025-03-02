# Japanese Listening Comprehension App

## Introduction
This application is specifically designed to help users improve their Japanese listening comprehension skills through interactive exercises based on authentic Japanese content. The app leverages AI technology to create a personalized Japanese language learning experience.

## Architecture
+------------------------------------------+
|                  Frontend                |
|         (Streamlit Web Application)      |
+------------------+---------------------+
                   |
+------------------------------------------+
|                  Backend                 |
|                                          |
|  +---------------+      +--------------+ |
|  | YouTube       |      | LLM Agent    | |
|  | Transcript    |----->| (Question    | |
|  | Fetcher       |      | Generation)  | |
|  +---------------+      +--------------+ |
|                               |          |
|  +---------------+      +--------------+ |
|  | Vector DB     |<---->| Text-to-     | |
|  | (SQLite w/    |      | Speech (TTS) | |
|  | vector ext.)  |      |              | |
|  +---------------+      +--------------+ |
|                               |          |
|  +---------------+      +--------------+ |
|  | Optional:     |      | Optional:    | |
|  | ASR Module    |      | Translation  | |
|  | (for answers) |      | Module       | |
|  +---------------+      +--------------+ |
+------------------------------------------+

## Component Breakdown

### YouTube Transcript Fetcher
- Fetches transcripts from YouTube videos with Japanese content
- Specializes in handling Japanese language transcripts and captions
- Processes and cleans Japanese transcript data for accurate learning materials
- Supports furigana annotation for kanji when available

### Vector Database (SQLite with vector extension)
- Stores Japanese transcripts and their embeddings for efficient retrieval
- Enables semantic search capabilities optimized for Japanese language content
- Maintains relationships between kanji, kana, and romaji versions of content

### LLM Agent for Question Generation
- Uses OpenAI's GPT-4o to analyze Japanese transcripts and generate relevant comprehension questions
- Creates questions at different JLPT levels (N5-N1)
- Provides hints and answer keys with grammatical explanations specific to Japanese
- Identifies key Japanese vocabulary and grammar points in the content

### Text-to-Speech (TTS) Module
- Converts questions and passages to spoken Japanese with native-like pronunciation
- Supports multiple Japanese voice types (male/female, formal/casual, regional accents)
- Configurable speech parameters optimized for Japanese language learning
- Adjustable speaking rates for beginner to advanced learners

### Optional: ASR Module (for user responses)
- Captures user's spoken Japanese responses for evaluation
- Provides feedback on Japanese pronunciation, pitch accent, and intonation
- Uses Whisper with Japanese-optimized models for accurate recognition
- Handles common non-native speaker pronunciation issues in Japanese

### Frontend with Streamlit
- User-friendly interface with both English and Japanese UI options
- Japanese-focused interactive question-answering experience
- Progress tracking across different JLPT levels and speaking/listening skills
- Audio playback controls with Japanese-specific features like pitch accent visualization

## Requirements File
```
streamlit==1.33.0
youtube-transcript-api==0.6.2
openai==1.12.0
numpy==1.26.4
sentence-transformers==2.5.1
boto3==1.29.6
google-cloud-texttospeech==2.15.0
openai-whisper==20231117
```

## Docker Setup (Optional)
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8501

CMD ["streamlit", "run", "app.py"]
```

## Starting the Application
```bash
#!/bin/bash
pip install -r requirements.txt
streamlit run app.py
```

## Technology Choices Explanation
- **Frontend**: Streamlit for rapid development and ease of use with ML/AI applications for Japanese language learning.
- **Vector Database**: Using SQLite with a custom vector extension approach optimized for Japanese text and character variants.
- **LLM for Question Generation**: Using OpenAI's GPT-4o for generating high-quality Japanese comprehension questions with cultural context.
- **TTS Options**:
  - Amazon Polly: Selected Japanese voices (Takumi, Mizuki, Kazuha) with natural pitch accent
  - Google TTS: High-quality Japanese voices with regional accent options
- **ASR Options**:
  - OpenAI Whisper: Fine-tuned for Japanese speech recognition with accent adaptation
  - (Optional) Amazon Transcribe with Japanese-specific language packs
- **YouTube Transcript API**: For fetching existing Japanese transcripts from videos

## Japanese Language Features
- **JLPT Level Classification**: Content and questions tagged by appropriate JLPT level (N5-N1)
- **Kanji Support**: Hover-over furigana readings for kanji
- **Grammar Point Identification**: Highlights and explains Japanese grammar structures
- **Pitch Accent Visualization**: Shows pitch patterns for proper pronunciation
- **Cultural Context**: Provides cultural notes for better comprehension
- **Dialect Support**: Options for standard Tokyo dialect or regional variations

## Usage Instructions

### Setup
1. Clone the repository
2. Install dependencies using `pip install -r requirements.txt`
3. Create a `.env` file with your API keys:
   ```
   OPENAI_API_KEY=your_openai_key
   AWS_ACCESS_KEY_ID=your_aws_key  # If using Amazon Polly
   AWS_SECRET_ACCESS_KEY=your_aws_secret  # If using Amazon Polly
   GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json  # If using Google TTS
   ```

### Running the App
1. Start the application with `streamlit run app.py`
2. Enter a YouTube URL containing Japanese content
3. Select JLPT level (N5-N1) and number of questions
4. Practice Japanese listening comprehension with generated questions
5. Submit answers either by typing in Japanese or speaking (if ASR is enabled)

### Features
- **Japanese Content Selection**: Choose from Japanese YouTube videos or predefined Japanese listening materials
- **JLPT-based Difficulty Levels**: Adjust difficulty from N5 (beginner) to N1 (advanced)
- **Interactive Japanese Quizzes**: Answer generated questions about the Japanese content
- **Pronunciation Practice**: Repeat Japanese phrases for listening and speaking practice
- **Progress Tracking**: Monitor improvement in Japanese language skills over time
- **Japanese Vocabulary Building**: Extract and study key words with kanji, readings, and example sentences

## Development Roadmap
- [x] Basic application structure for Japanese learning
- [x] Japanese YouTube transcript fetching
- [x] Japanese-focused question generation with LLM
- [x] Japanese Text-to-Speech integration
- [ ] Japanese ASR for spoken answers with pronunciation feedback
- [ ] User accounts with Japanese language learning progress tracking
- [ ] Expanded Japanese content library organized by topic and JLPT level
- [ ] Mobile-friendly interface with Japanese input support
- [ ] Offline mode support for downloaded Japanese lessons