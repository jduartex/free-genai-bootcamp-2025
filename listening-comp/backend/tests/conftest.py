import pytest
import os
import tempfile
import sqlite3
from pathlib import Path
import sys
from limits.storage import MemoryStorage
import openai
from unittest.mock import MagicMock

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.append(str(backend_dir))

from api import app, limiter, cache
from vector_db import JapaneseVectorDB  # Add this import

@pytest.fixture(autouse=True)
def setup_limiter():
    """Configure limiter to use memory storage for all tests."""
    from api import app
    app.config['RATELIMIT_STORAGE_URL'] = "memory://"
    app.config['RATELIMIT_ENABLED'] = True

@pytest.fixture
def test_client():
    """Create a test client for the Flask application."""
    app.config.update({
        'TESTING': True,
        'CACHE_TYPE': "SimpleCache",
        'CACHE_DEFAULT_TIMEOUT': 300
    })
    
    with app.test_client() as client:
        yield client

@pytest.fixture
def rate_limited_client():
    """Create a test client with rate limiting enabled."""
    app.config.update({
        'TESTING': True,
        'RATELIMIT_ENABLED': True,
        'RATELIMIT_STORAGE_URL': "memory://",
        'RATELIMIT_DEFAULT': "2 per second"  # Much stricter limit for testing
    })
    
    # Reset limiter state
    limiter.reset()
    
    # Create fresh storage for each test
    storage = MemoryStorage()
    limiter._limiter.storage = storage
    limiter._storage = storage
    
    with app.test_client() as client:
        yield client

# Add custom mark for mecab tests
def pytest_configure(config):
    """Add custom markers."""
    config.addinivalue_line(
        "markers", "skip_if_no_mecab: mark test to skip if MeCab is not available"
    )

@pytest.fixture
def test_db():
    """Create a temporary test database."""
    db_fd, db_path = tempfile.mkstemp()
    
    # Create test tables
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS transcripts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_url TEXT NOT NULL,
        video_id TEXT,
        title TEXT,
        content TEXT NOT NULL,
        content_embedding BLOB,
        metadata TEXT,
        jlpt_level TEXT,
        language_code TEXT DEFAULT 'ja',
        tags TEXT,
        date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS segments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transcript_id INTEGER NOT NULL,
        segment_id INTEGER NOT NULL,
        start_time REAL,
        end_time REAL,
        text TEXT NOT NULL,
        embedding BLOB,
        FOREIGN KEY (transcript_id) REFERENCES transcripts (id) ON DELETE CASCADE
    )''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transcript_id INTEGER,
        segment_id INTEGER,
        question TEXT NOT NULL,
        options TEXT NOT NULL,         
        answer TEXT NOT NULL,
        explanation TEXT,
        jlpt_level TEXT,
        question_type TEXT DEFAULT 'multiple-choice',
        FOREIGN KEY (transcript_id) REFERENCES transcripts (id),
        FOREIGN KEY (segment_id) REFERENCES segments (id)
    )''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        transcript_id INTEGER,
        questions_attempted INTEGER DEFAULT 0,
        questions_correct INTEGER DEFAULT 0,
        last_access TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completion_time INTEGER,
        jlpt_level TEXT,
        notes TEXT,
        FOREIGN KEY (transcript_id) REFERENCES transcripts (id)
    )''')
    
    conn.commit()
    conn.close()
    
    yield db_path
    
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def test_vector_db(test_db):
    """Create a test instance of JapaneseVectorDB."""
    return JapaneseVectorDB(db_path=test_db)

@pytest.fixture
def sample_japanese_content():
    """Provide sample Japanese content for testing."""
    return {
        "basic": {
            "text": "私は日本語を勉強しています。",
            "level": "N5",
            "translation": "I am studying Japanese."
        },
        "intermediate": {
            "text": "日本の文化について理解を深めたいと思っています。",
            "level": "N3",
            "translation": "I want to deepen my understanding of Japanese culture."
        },
        "advanced": {
            "text": "現代社会における技術革新の影響について考察してみましょう。",
            "level": "N1",
            "translation": "Let's consider the impact of technological innovation in modern society."
        }
    }

@pytest.fixture
def mock_openai(monkeypatch):
    """Mock OpenAI API calls."""
    # Mock OpenAI API client and responses
    class MockChatCompletions:
        def create(self, *args, **kwargs):
            return type('obj', (), {
                'choices': [
                    type('obj', (), {
                        'message': type('obj', (), {
                            'content': '{"questions": []}'
                        })
                    })
                ]
            })

    class MockSpeech:
        def create(self, *args, **kwargs):
            return type('obj', (), {
                'read': lambda: b"audio data"
            })

    class MockAudioClient:
        def __init__(self):
            self.speech = MockSpeech()
            
    class MockClient:
        def __init__(self):
            self.chat = type('obj', (), {'completions': MockChatCompletions()})
            self.audio = MockAudioClient()

    # Replace the entire OpenAI client
    monkeypatch.setattr("openai.Client", MockClient)
    monkeypatch.setattr("openai._client", MockClient())
