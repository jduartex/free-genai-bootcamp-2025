import os
import sqlite3
import numpy as np
import asyncio
from typing import List, Dict, Any, Optional, Tuple, Union, BinaryIO
from sentence_transformers import SentenceTransformer
import json
import re
import pickle
import logging
from datetime import datetime
import time
from functools import wraps
from contextlib import contextmanager

from embedding_service import JapaneseEmbeddingService

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def timer_decorator(func):
    """Decorator to time function execution"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        logger.debug(f"Function {func.__name__} took {end_time - start_time:.4f} seconds to run")
        return result
    return wrapper

class JapaneseVectorDB:
    """
    Enhanced SQLite database with vector extension for Japanese text storage, retrieval, and search.
    Handles embeddings generation, storage, and similarity search for Japanese content.
    """
    
    def __init__(self, db_path: str = None, embedding_model: str = "default"):
        """
        Initialize the vector database for Japanese content.
        
        Args:
            db_path: Path to the SQLite database file
            embedding_model: Name of the embedding model to use
        """
        if db_path is None:
            # Use default path relative to this file
            db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                                  "data/japanese_content.db")
        
        # Ensure the directory exists
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        self.db_path = db_path
        
        # Initialize the embedding service
        self.embedding_service = JapaneseEmbeddingService(model_name=embedding_model)
        
        # Initialize database schema
        self._initialize_db_schema()
        
        logger.info(f"Japanese Vector DB initialized with database at {db_path}")
    
    def _initialize_db_schema(self):
        """Initialize the database schema with necessary tables and indices."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Transcripts table - stores full transcripts
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
            )
            ''')
            
            # Segments table
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
            )
            ''')
            
            # Questions table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transcript_id INTEGER,
                segment_id INTEGER,
                question TEXT NOT NULL,
                options TEXT NOT NULL,         -- Options stored as JSON array
                answer TEXT NOT NULL,
                explanation TEXT,
                jlpt_level TEXT,
                question_type TEXT DEFAULT 'multiple-choice',
                FOREIGN KEY (transcript_id) REFERENCES transcripts (id),
                FOREIGN KEY (segment_id) REFERENCES segments (id)
            )
            ''')
            
            # Vocabulary table - stores vocabulary extracted from transcripts
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS vocabulary (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word TEXT NOT NULL,
                reading TEXT NOT NULL,
                meaning TEXT,
                jlpt_level TEXT,
                part_of_speech TEXT,
                example_sentence TEXT,
                transcript_id INTEGER,
                frequency INTEGER DEFAULT 1,
                FOREIGN KEY (transcript_id) REFERENCES transcripts (id)
            )
            ''')
            
            # Create indices for better query performance
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_transcript_source ON transcripts(source_url)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_segment_transcript ON segments(transcript_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_question_transcript ON questions(transcript_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_vocabulary_word ON vocabulary(word)')
            
            conn.commit()
    
    @contextmanager
    def _get_connection(self):
        """Context manager for database connections."""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row  # Return rows as dictionaries
            yield conn
        finally:
            if conn:
                conn.close()
    
    @timer_decorator
    def generate_embedding(self, text: str) -> np.ndarray:
        """
        Generate embedding for Japanese text.
        
        Args:
            text: Japanese text to embed
            
        Returns:
            Embedding vector as numpy array
        """
        try:
            # Use the embedding service to generate embeddings
            return self.embedding_service.generate_embeddings(text)
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            # Return zero vector of correct dimension as fallback
            return np.zeros(self.embedding_service.get_embedding_dimension())
    
    def _serialize_embedding(self, embedding: np.ndarray) -> bytes:
        """
        Serialize embedding to bytes for storage in SQLite.
        
        Args:
            embedding: Numpy array of embeddings
            
        Returns:
            Serialized embedding
        """
        return pickle.dumps(embedding)
    
    def _deserialize_embedding(self, embedding_bytes: bytes) -> np.ndarray:
        """
        Deserialize embedding from bytes.
        
        Args:
            embedding_bytes: Serialized embedding
            
        Returns:
            Embedding as numpy array
        """
        if embedding_bytes is None:
            return None
        return pickle.loads(embedding_bytes)
    
    @timer_decorator
    def store_transcript(self, source_url: str, content: str, metadata: Dict[str, Any] = None, 
                        video_id: str = None, title: str = None) -> int:
        """
        Store a transcript with its embedding.
        
        Args:
            source_url: Source URL of the transcript
            content: Full text content of the transcript
            metadata: Additional metadata
            video_id: ID of the video (if from YouTube)
            title: Title of the content
            
        Returns:
            Transcript ID
        """
        try:
            # Generate embedding for the content
            embedding = self.generate_embedding(content)
            
            # Serialize the embedding
            embedding_bytes = self._serialize_embedding(embedding)
            
            # Convert metadata to JSON if provided
            metadata_json = json.dumps(metadata) if metadata else "{}"
            
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                # Store the transcript
                cursor.execute("""
                    INSERT INTO transcripts (source_url, video_id, title, content, content_embedding, metadata)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (source_url, video_id, title, content, embedding_bytes, metadata_json))
                
                transcript_id = cursor.lastrowid
                
                # Split and store individual segments
                self._store_segments(transcript_id, content, conn)
                
                conn.commit()
                
            logger.info(f"Stored transcript ID {transcript_id} from source {source_url}")
            return transcript_id
            
        except Exception as e:
            logger.error(f"Error storing transcript: {str(e)}")
            raise
    
    def _store_segments(self, transcript_id: int, content: str, conn: sqlite3.Connection) -> None:
        """
        Split content into segments and store them with embeddings.
        
        Args:
            transcript_id: ID of the parent transcript
            content: Content to split and store
            conn: Database connection
        """
        # Simple sentence splitting for Japanese text
        # In a real implementation, use a more sophisticated approach for Japanese
        segments = re.split(r'[。．！？\.\!\?]+', content)
        segments = [seg.strip() for seg in segments if seg.strip()]
        
        cursor = conn.cursor()
        
        # Process in batches to avoid memory issues
        batch_size = 20
        for i in range(0, len(segments), batch_size):
            batch = segments[i:i+batch_size]
            
            # Generate embeddings for the batch
            embeddings = self.embedding_service.generate_embeddings(batch)
            
            # Store each segment with its embedding
            for j, (segment, embedding) in enumerate(zip(batch, embeddings)):
                segment_id = i + j
                embedding_bytes = self._serialize_embedding(embedding)
                
                cursor.execute("""
                    INSERT INTO segments (transcript_id, segment_id, text, embedding)
                    VALUES (?, ?, ?, ?)
                """, (transcript_id, segment_id, segment, embedding_bytes))
    
    def store_questions(self, transcript_id: int, questions: List[Dict[str, Any]], segment_id: Optional[int] = None) -> None:
        """
        Store questions for a transcript or specific segment.
        
        Args:
            transcript_id: ID of the transcript
            questions: List of question dictionaries
            segment_id: Optional segment ID if questions are for a specific segment
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            for question in questions:
                # Convert options to JSON
                options_json = json.dumps(question.get("options", []))
                
                cursor.execute("""
                    INSERT INTO questions 
                    (transcript_id, segment_id, question, options, answer, explanation, jlpt_level, question_type)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    transcript_id, 
                    segment_id,
                    question.get("question", ""),
                    options_json,
                    question.get("answer", ""),
                    question.get("explanation", ""),
                    question.get("jlpt_level", "N5"),
                    question.get("question_type", "multiple-choice")
                ))
            
            conn.commit()
        
        logger.info(f"Stored {len(questions)} questions for transcript ID {transcript_id}")
    
    @timer_decorator
    def search_similar_content(self, query: str, limit: int = 5, jlpt_level: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search for similar content."""
        query_embedding = self.generate_embedding(query)
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Base query
            sql = """
                SELECT s.id, s.transcript_id, s.text, s.embedding, t.source_url, t.title, t.jlpt_level
                FROM segments s
                INNER JOIN transcripts t ON s.transcript_id = t.id
                WHERE s.embedding IS NOT NULL
            """
            
            params = []
            
            if jlpt_level:
                sql += " AND t.jlpt_level = ?"
                params.append(jlpt_level)
            
            cursor.execute(sql, params)
            results = []
            
            for row in cursor:
                embedding = self._deserialize_embedding(row['embedding'])
                if embedding is not None:
                    similarity = float(self.embedding_service.cosine_similarity(query_embedding, embedding))
                    results.append({
                        "id": row["id"],
                        "transcript_id": row["transcript_id"],
                        "text": row["text"],
                        "source_url": row["source_url"],
                        "title": row["title"],
                        "jlpt_level": row["jlpt_level"],
                        "similarity": similarity
                    })
            
            # Sort by similarity and limit results
            results.sort(key=lambda x: x['similarity'], reverse=True)
            return results[:limit]
    
    def _cosine_similarity_func(self, embedding1_bytes: bytes, embedding2_bytes: bytes) -> float:
        """
        SQLite function for computing cosine similarity between two embeddings.
        
        Args:
            embedding1_bytes: First embedding in serialized form
            embedding2_bytes: Second embedding in serialized form
            
        Returns:
            Cosine similarity score
        """
        try:
            embedding1 = self._deserialize_embedding(embedding1_bytes)
            embedding2 = self._deserialize_embedding(embedding2_bytes)
            
            if embedding1 is None or embedding2 is None:
                return -1
            
            # Compute cosine similarity
            dot_product = np.dot(embedding1, embedding2)
            norm1 = np.linalg.norm(embedding1)
            norm2 = np.linalg.norm(embedding2)
            
            if norm1 == 0 or norm2 == 0:
                return 0
                
            return dot_product / (norm1 * norm2)
            
        except Exception as e:
            logger.error(f"Error in similarity calculation: {str(e)}")
            return -1
    
    def get_transcript_by_id(self, transcript_id: int) -> Optional[Dict[str, Any]]:
        """
        Retrieve a transcript by its ID.
        
        Args:
            transcript_id: ID of the transcript
            
        Returns:
            Transcript data or None if not found
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, source_url, video_id, title, content, metadata, jlpt_level, 
                       language_code, tags, date_added
                FROM transcripts
                WHERE id = ?
            """, (transcript_id,))
            
            row = cursor.fetchone()
            
            if not row:
                return None
                
            # Convert row to dictionary
            transcript = dict(row)
            
            # Parse metadata JSON
            if transcript["metadata"]:
                transcript["metadata"] = json.loads(transcript["metadata"])
            else:
                transcript["metadata"] = {}
                
            # Parse tags JSON
            if transcript["tags"]:
                transcript["tags"] = json.loads(transcript["tags"])
            else:
                transcript["tags"] = []
                
            # Get segments
            cursor.execute("""
                SELECT id, segment_id, start_time, end_time, text
                FROM segments
                WHERE transcript_id = ?
                ORDER BY segment_id
            """, (transcript_id,))
            
            segments = [dict(row) for row in cursor.fetchall()]
            transcript["segments"] = segments
            
            return transcript
    
    def get_questions_by_transcript_id(self, transcript_id: int, jlpt_level: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retrieve questions for a transcript, optionally filtered by JLPT level.
        
        Args:
            transcript_id: ID of the transcript
            jlpt_level: Optional JLPT level filter
            
        Returns:
            List of questions
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            if jlpt_level:
                cursor.execute("""
                    SELECT id, segment_id, question, options, answer, explanation, 
                           jlpt_level, question_type
                    FROM questions
                    WHERE transcript_id = ? AND jlpt_level = ?
                    ORDER BY id
                """, (transcript_id, jlpt_level))
            else:
                cursor.execute("""
                    SELECT id, segment_id, question, options, answer, explanation,
                           jlpt_level, question_type
                    FROM questions
                    WHERE transcript_id = ?
                    ORDER BY id
                """, (transcript_id,))
            
            questions = []
            for row in cursor:
                question = dict(row)
                
                # Parse options JSON
                if question["options"]:
                    question["options"] = json.loads(question["options"])
                else:
                    question["options"] = []
                    
                questions.append(question)
                
        return questions
    
    def update_transcript_jlpt_level(self, transcript_id: int, jlpt_level: str) -> bool:
        """
        Update the JLPT level of a transcript.
        
        Args:
            transcript_id: ID of the transcript
            jlpt_level: JLPT level (N1-N5)
            
        Returns:
            True if successful, False otherwise
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE transcripts
                SET jlpt_level = ?
                WHERE id = ?
            """, (jlpt_level, transcript_id))
            
            conn.commit()
            
            return cursor.rowcount > 0
    
    def store_vocabulary(self, transcript_id: int, vocabulary: List[Dict[str, Any]]) -> None:
        """
        Store vocabulary items extracted from a transcript.
        
        Args:
            transcript_id: ID of the transcript
            vocabulary: List of vocabulary items
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            for item in vocabulary:
                cursor.execute("""
                    INSERT INTO vocabulary 
                    (word, reading, meaning, jlpt_level, part_of_speech, example_sentence, transcript_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    item.get("word", ""),
                    item.get("reading", ""),
                    item.get("meaning", ""),
                    item.get("jlpt_level", ""),
                    item.get("part_of_speech", ""),
                    item.get("example_sentence", ""),
                    transcript_id
                ))
            
            conn.commit()
            
        logger.info(f"Stored vocabulary for transcript ID {transcript_id}")

class VectorDatabase:
    def __init__(self, db_path: str = "data/transcript_db.sqlite"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initialize the database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create tables if they don't exist
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS transcripts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            metadata TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        conn.commit()
        conn.close()

    async def analyze_transcript(self, transcript: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Store and analyze a transcript
        
        Args:
            transcript (str): The transcript text
            metadata (dict, optional): Additional metadata about the transcript
            
        Returns:
            dict: Analysis results
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Store the transcript
            cursor.execute(
                'INSERT INTO transcripts (content, metadata) VALUES (?, ?)',
                (transcript, json.dumps(metadata or {}))
            )
            
            transcript_id = cursor.lastrowid
            conn.commit()
            
            # Basic analysis (placeholder for now)
            analysis = {
                "transcript_id": transcript_id,
                "char_count": len(transcript),
                "word_count": len(transcript.split()),
                "status": "success"
            }
            
            return analysis
            
        except Exception as e:
            return {"status": "error", "message": str(e)}
            
        finally:
            conn.close()

# Example usage
if __name__ == "__main__":
    # Test the vector database
    db = JapaneseVectorDB()
    
    # Example Japanese content
    content = "日本語のリスニング練習をするのは大切です。毎日少しずつ練習しましょう。"
    
    # Store a transcript
    transcript_id = db.store_transcript(
        source_url="https://example.com/video1", 
        content=content,
        metadata={"title": "日本語練習", "duration": 120}
    )
    
    print(f"Stored transcript with ID: {transcript_id}")
    
    # Search for similar content
    results = db.search_similar_content("日本語を勉強しています")
    
    print("Similar content:")
    for result in results:
        print(f"ID: {result['id']}, Similarity: {result['similarity']}")
        print(f"Content: {result['content'][:50]}...")
        print("-" * 50)
