import os
import sqlite3
import numpy as np
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from sentence_transformers import SentenceTransformer
import json
import re

class VectorDatabase:
    """
    Implements SQLite with vector extension for Japanese text storage and retrieval
    """
    
    def __init__(self, db_path: str = "data/transcript_db.sqlite"):
        """
        Initialize the vector database
        
        Args:
            db_path: Path to the SQLite database file
        """
        # Ensure data directory exists
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        self.db_path = db_path
        self.model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        
        # Initialize the database
        self._init_db()
    
    def _init_db(self):
        """Initialize the SQLite database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create tables if they don't exist
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS transcripts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_id TEXT NOT NULL,
            language_code TEXT NOT NULL,
            full_text TEXT NOT NULL,
            metadata TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS transcript_segments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transcript_id INTEGER NOT NULL,
            segment_id INTEGER NOT NULL,
            start_time REAL NOT NULL,
            end_time REAL NOT NULL,
            text TEXT NOT NULL,
            embedding BLOB,
            FOREIGN KEY (transcript_id) REFERENCES transcripts(id) ON DELETE CASCADE
        )
        ''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS jlpt_vocabulary (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word TEXT NOT NULL,
            reading TEXT NOT NULL,
            meaning TEXT NOT NULL,
            jlpt_level TEXT NOT NULL,
            part_of_speech TEXT,
            example_sentence TEXT
        )
        ''')
        
        # Create indexes
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_video_id ON transcripts(video_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_transcript_segment ON transcript_segments(transcript_id, segment_id)')
        
        conn.commit()
        conn.close()
    
    async def store_transcript(self, video_id: str, transcript_data: Dict[str, Any]) -> int:
        """
        Store a transcript and its segments in the database
        
        Args:
            video_id: YouTube video ID
            transcript_data: Processed transcript data
            
        Returns:
            ID of the inserted transcript
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Store the transcript
            cursor.execute(
                'INSERT INTO transcripts (video_id, language_code, full_text, metadata) VALUES (?, ?, ?, ?)',
                (
                    video_id,
                    transcript_data.get('language_code', 'ja'),
                    transcript_data.get('processed_transcript', {}).get('full_text', ''),
                    json.dumps(transcript_data.get('metadata', {}))
                )
            )
            transcript_id = cursor.lastrowid
            
            # Store the segments with embeddings
            segments = transcript_data.get('processed_transcript', {}).get('sentence_segments', [])
            
            # Process embeddings in batches asynchronously
            batch_size = 10
            for i in range(0, len(segments), batch_size):
                batch = segments[i:i+batch_size]
                texts = [segment['text'] for segment in batch]
                
                # Generate embeddings
                embeddings = await asyncio.to_thread(self.model.encode, texts)
                
                # Store segments with their embeddings
                for j, segment in enumerate(batch):
                    embedding_bytes = embeddings[j].tobytes()
                    cursor.execute(
                        'INSERT INTO transcript_segments (transcript_id, segment_id, start_time, end_time, text, embedding) VALUES (?, ?, ?, ?, ?, ?)',
                        (
                            transcript_id,
                            segment['id'],
                            segment['start'],
                            segment['end'],
                            segment['text'],
                            embedding_bytes
                        )
                    )
            
            conn.commit()
            return transcript_id
            
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    async def analyze_transcript(self, transcript_text: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Analyze a transcript for Japanese language learning features
        
        Args:
            transcript_text: The transcript text
            metadata: Additional metadata about the transcript
            
        Returns:
            Analysis results including JLPT level estimation and key vocabulary
        """
        # Placeholder for actual implementation
        # In a real implementation, we'd:
        # 1. Extract key vocabulary
        # 2. Estimate JLPT level of the content
        # 3. Identify grammar patterns
        # 4. Extract cultural references
        
        analysis = {
            "estimated_jlpt_level": "N4",  # This would be calculated based on vocabulary and grammar
            "key_vocabulary": await self._extract_key_vocabulary(transcript_text),
            "grammar_points": await self._extract_grammar_points(transcript_text),
            "cultural_references": [],
            "difficulty_score": 65  # 0-100 scale
        }
        
        return analysis
    
    async def search_similar_segments(self, query_text: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Search for transcript segments similar to the query text
        
        Args:
            query_text: Text to search for
            limit: Maximum number of results to return
            
        Returns:
            List of similar segments with similarity scores
        """
        # Generate embedding for the query text
        query_embedding = await asyncio.to_thread(self.model.encode, [query_text])
        query_embedding_array = query_embedding[0]
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Get all segments and calculate similarity
            cursor.execute('SELECT id, transcript_id, segment_id, text, embedding FROM transcript_segments')
            
            results = []
            for row in cursor.fetchall():
                segment_id, transcript_id, orig_segment_id, text, embedding_bytes = row
                
                if embedding_bytes:
                    # Convert bytes back to numpy array
                    embedding_array = np.frombuffer(embedding_bytes, dtype=np.float32)
                    
                    # Calculate cosine similarity
                    similarity = np.dot(query_embedding_array, embedding_array) / (
                        np.linalg.norm(query_embedding_array) * np.linalg.norm(embedding_array))
                    
                    results.append({
                        'segment_id': segment_id,
                        'transcript_id': transcript_id,
                        'text': text,
                        'similarity': float(similarity)
                    })
            
            # Sort by similarity (highest first) and return top results
            results.sort(key=lambda x: x['similarity'], reverse=True)
            return results[:limit]
            
        finally:
            conn.close()
    
    async def _extract_key_vocabulary(self, text: str) -> List[Dict[str, str]]:
        """
        Extract key Japanese vocabulary from text
        """
        # Placeholder - in a real implementation, we'd use a Japanese morphological analyzer
        # like Sudachi or MeCab to properly extract words
        
        # For demonstration, just returning a sample list
        return [
            {"word": "勉強", "reading": "べんきょう", "meaning": "study", "jlpt_level": "N5"},
            {"word": "理解", "reading": "りかい", "meaning": "understanding", "jlpt_level": "N4"},
            {"word": "単語", "reading": "たんご", "meaning": "word, vocabulary", "jlpt_level": "N5"}
        ]
    
    async def _extract_grammar_points(self, text: str) -> List[Dict[str, str]]:
        """
        Extract Japanese grammar patterns from text
        """
        # Placeholder - in a real implementation, we'd have a database of grammar patterns
        # and use regex or more sophisticated NLP to identify them
        
        # For demonstration, just returning a sample list
        return [
            {"pattern": "〜ています", "explanation": "indicates an ongoing action", "jlpt_level": "N5"},
            {"pattern": "〜かもしれません", "explanation": "indicates possibility (may, might)", "jlpt_level": "N4"}
        ]
