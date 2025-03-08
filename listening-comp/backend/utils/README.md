# Backend Utilities

This directory contains utility scripts for testing and configuring the backend components.

## Vector Database Testing

The `test_vector_db.py` script allows you to validate that your vector database setup is working properly:

### Usage

```bash
# Run all tests with default test database
python backend/utils/test_vector_db.py

# Run all tests with custom database path
python backend/utils/test_vector_db.py --db_path data/test_vectors.db

# Run specific test
python backend/utils/test_vector_db.py --test init
python backend/utils/test_vector_db.py --test embeddings
python backend/utils/test_vector_db.py --test processing
python backend/utils/test_vector_db.py --test store
python backend/utils/test_vector_db.py --test search
```

### What the Tests Verify

1. **Initialization Test**: Confirms that the SQLite vector extension is properly loaded
2. **Embeddings Service Test**: Verifies the embedding model can be loaded
3. **Text Processing Test**: Ensures Japanese text can be processed into kanji, kana, and romaji forms
4. **Store & Retrieve Test**: Tests storing transcripts and retrieving them by video ID
5. **Vector Search Test**: Validates semantic search functionality with vector similarity

### Troubleshooting

If tests fail, check:

1. SQLite vector extension installation
2. Required Python packages (sentence-transformers, fugashi, ipadic, romkan)
3. Access permissions to the database directory
4. GPU/CPU memory availability for the embedding model

## Running with Docker

If you're using Docker, you can run the tests with:

```bash
docker build -t japanese-listening-app .
docker run --rm japanese-listening-app python backend/utils/test_vector_db.py
```
