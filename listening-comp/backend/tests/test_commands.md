# Testing Commands for Backend Components

## Running All Tests
```bash
# From project root
pytest

# With verbose output
pytest -v

# With coverage report
pytest --cov=backend
```

## Testing Individual Components

### 1. API Tests
```bash
# Test all API endpoints
pytest backend/tests/test_api.py

# Test specific function
pytest backend/tests/test_api.py -k "test_health_check"
```

### 2. Vector Database Tests
```bash
# Test vector database functionality
pytest backend/tests/test_vector_db.py

# With detailed output
pytest -v backend/tests/test_vector_db.py
```

### 3. Speech Recognition Tests
```bash
# Test speech recognition
pytest backend/tests/test_speech_recognition.py
```

### 4. Progress Tracking Tests
```bash
# Test progress tracking
pytest backend/tests/test_progress_tracker.py
```

### 5. Pronunciation Analysis Tests
```bash
# Test pronunciation analysis
pytest backend/tests/test_pronunciation_analysis.py
```

## Testing with Debug Output
```bash
# Show print statements
pytest -s

# Show local variables on failure
pytest --showlocals

# Stop on first failure
pytest -x
```

## Test Coverage Reports
```bash
# Generate coverage report
pytest --cov=backend --cov-report=term-missing

# Generate HTML coverage report
pytest --cov=backend --cov-report=html
```

## Common Testing Options
- `-v`: Verbose output
- `-s`: Show print statements
- `-x`: Stop after first failure
- `-k "test_name"`: Run specific test
- `--pdb`: Drop into debugger on failure
- `--cov`: Generate coverage report

## Running Tests by Pattern
```bash
# Run all tests with "api" in the name
pytest -v -k "api"

# Run all tests with "database" in the name
pytest -v -k "database"
```

## Environment Setup for Tests
```bash
# Set test environment
export TESTING=true

# Use test database
export TEST_DATABASE_URL=sqlite:///test.db

# Run tests with specific environment
TESTING=true pytest
```

## Testing Specific Features

### API Endpoints
```bash
pytest backend/tests/test_api.py -k "test_fetch_transcript"
pytest backend/tests/test_api.py -k "test_generate_questions"
pytest backend/tests/test_api.py -k "test_text_to_speech"
```

### Database Operations
```bash
pytest backend/tests/test_vector_db.py -k "test_embedding_generation"
pytest backend/tests/test_vector_db.py -k "test_similar_content_search"
```

### Speech Recognition
```bash
pytest backend/tests/test_speech_recognition.py -k "test_audio_processing"
```

### Progress Tracking
```bash
pytest backend/tests/test_progress_tracker.py -k "test_progress_tracking"
pytest backend/tests/test_progress_tracker.py -k "test_progress_summary"
```
