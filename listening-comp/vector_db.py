import sqlite3
import numpy as np
import logging
import os
from typing import List, Dict, Any, Optional, Tuple
import json

logger = logging.getLogger(__name__)

class VectorDatabase:
    """Vector Database using SQLite with vector extension for Japanese transcript storage and retrieval"""
    
    def __init__(self, db_path: str = "japanese_transcripts.db"):
        """Initialize the vector database"""
        self.db_path = db_path
        self.initialized = self._initialize_db()
        
    def _initialize_db(self) -> bool:
        """Initialize the SQLite database with vector extension"""
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(os.path.abspath(self.db_path)), exist_ok=True)
            
            # Connect to database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Load SQLite vector extension
            try:
                # Try to load the extension
                cursor.execute("SELECT load_extension('sqlite3_vss')")
            except sqlite3.OperationalError:
                logger.warning("Could not load vector extension directly. This may be expected on some systems.")
                # On some systems, the extension might be in a different location or named differently
                try:
                    # Try common alternative paths
                    cursor.execute("SELECT load_extension('libsqlite3_vss')")
                except sqlite3.OperationalError:
                    logger.error("Failed to load SQLite vector extension. Vector search will not work.")
                    return False
            
            # Create tables if they don't exist
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS transcripts (
                id INTEGER PRIMARY KEY,
                video_id TEXT NOT NULL,
                kanji TEXT NOT NULL,
                kana TEXT,
                romaji TEXT,
                jlpt_level TEXT,
                timestamp REAL,
                embedding BLOB
            )
            """)
            
            # Create vector index
            try:
                cursor.execute("CREATE VIRTUAL TABLE IF NOT EXISTS transcript_vectors USING vss0(embedding(384))")
            except sqlite3.OperationalError as e:
                logger.error(f"Failed to create vector table: {e}")
                return False
                
            # Add trigger for vector index
            cursor.execute("""
            CREATE TRIGGER IF NOT EXISTS transcript_vectors_insert AFTER INSERT ON transcripts
            BEGIN
                INSERT INTO transcript_vectors(rowid, embedding) 
                VALUES (new.id, new.embedding);
            END
            """)
            
            conn.commit()
            conn.close()
            
            logger.info("Vector database initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize vector database: {e}")
            return False
    
    def store_transcript(self, video_id: str, kanji: str, kana: str = "", romaji: str = "", 
                        jlpt_level: str = "N5", timestamp: float = 0.0, 
                        embedding: Optional[np.ndarray] = None) -> bool:
        """Store a Japanese transcript with its embedding"""
        if not self.initialized:
            logger.error("Database not properly initialized")
            return False
            
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Convert numpy array to bytes for storage
            embedding_bytes = embedding.tobytes() if embedding is not None else None
            
            # Insert transcript
            cursor.execute(
                "INSERT INTO transcripts (video_id, kanji, kana, romaji, jlpt_level, timestamp, embedding) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (video_id, kanji, kana, romaji, jlpt_level, timestamp, embedding_bytes)
            )
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            logger.error(f"Failed to store transcript: {e}")
            return False
    
    def search_similar(self, query_embedding: np.ndarray, limit: int = 5) -> List[Dict[str, Any]]:
        """Search for similar transcripts using vector similarity"""
        if not self.initialized:
            logger.error("Database not properly initialized")
            return []
            
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Convert query embedding to bytes
            query_bytes = query_embedding.tobytes()
            
            # Perform vector similarity search
            cursor.execute("""
            SELECT t.id, t.video_id, t.kanji, t.kana, t.romaji, t.jlpt_level, t.timestamp, 
                   vss_distance(v.embedding, ?) as distance
            FROM transcript_vectors v
            JOIN transcripts t ON t.id = v.rowid
            ORDER BY distance ASC
            LIMIT ?
            """, (query_bytes, limit))
            
            results = []
            for row in cursor.fetchall():
                results.append({
                    "id": row[0],
                    "video_id": row[1],
                    "kanji": row[2],
                    "kana": row[3],
                    "romaji": row[4],
                    "jlpt_level": row[5],
                    "timestamp": row[6],
                    "distance": row[7]
                })
            
            conn.close()
            return results
            
        except Exception as e:
            logger.error(f"Failed to search similar transcripts: {e}")
            return []
    
    def get_transcript_by_id(self, transcript_id: int) -> Optional[Dict[str, Any]]:
        """Retrieve a transcript by ID"""
        if not self.initialized:
            logger.error("Database not properly initialized")
            return None
            
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("SELECT id, video_id, kanji, kana, romaji, jlpt_level, timestamp FROM transcripts WHERE id = ?", 
                          (transcript_id,))
            
            row = cursor.fetchone()
            if not row:
                return None
                
            result = {
                "id": row[0],
                "video_id": row[1],
                "kanji": row[2],
                "kana": row[3],
                "romaji": row[4],
                "jlpt_level": row[5],
                "timestamp": row[6]
            }
            
            conn.close()
            return result
            
        except Exception as e:
            logger.error(f"Failed to get transcript by ID: {e}")
            return None
    
    def get_transcripts_by_video(self, video_id: str) -> List[Dict[str, Any]]:
        """Retrieve all transcripts for a specific video"""
        if not self.initialized:
            logger.error("Database not properly initialized")
            return []
            
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
            SELECT id, video_id, kanji, kana, romaji, jlpt_level, timestamp 
            FROM transcripts 
            WHERE video_id = ?
            ORDER BY timestamp ASC
            """, (video_id,))
            
            results = []
            for row in cursor.fetchall():
                results.append({
                    "id": row[0],
                    "video_id": row[1],
                    "kanji": row[2],
                    "kana": row[3],
                    "romaji": row[4],
                    "jlpt_level": row[5],
                    "timestamp": row[6]
                })
            
            conn.close()
            return results
            
        except Exception as e:
            logger.error(f"Failed to get transcripts by video ID: {e}")
            return []
