import sqlite3
import os
import json
import pickle
import datetime
import shutil
from contextlib import contextmanager
from typing import List, Dict, Any, Optional, Union, Tuple, Generator

from .models import Transcript, Question, UserProgress, validate_transcript, validate_question

class DatabaseOperations:
    """Class to handle database operations for Japanese listening comprehension app."""
    
    def __init__(self, db_path=None):
        """Initialize with database path."""
        if db_path is None:
            # Use default path relative to this file
            db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                                  "data/japanese_content.db")
        
        self.db_path = db_path
        
    @contextmanager
    def get_connection(self, commit_on_success=True):
        """Context manager for database connections with transaction support."""
        conn = sqlite3.connect(self.db_path)
        try:
            yield conn
            if commit_on_success:
                conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    # ======== Transcript Operations ========
    
    def add_transcript(self, transcript_data: Dict[str, Any]) -> int:
        """Add a new transcript to the database."""
        # Validate transcript data
        errors = validate_transcript(transcript_data)
        if errors:
            raise ValueError(f"Invalid transcript data: {', '.join(errors)}")
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Convert metadata to JSON
            metadata_json = json.dumps(transcript_data.get('metadata', {}))
            
            # Get embedding if provided or use None
            embedding_bytes = transcript_data.get('content_embedding')
            
            cursor.execute("""
                INSERT INTO transcripts (source_url, content, content_embedding, metadata)
                VALUES (?, ?, ?, ?)
            """, (
                transcript_data['source_url'],
                transcript_data['content'],
                embedding_bytes,
                metadata_json
            ))
            
            return cursor.lastrowid
    
    def get_transcript(self, transcript_id: int) -> Optional[Transcript]:
        """Get a transcript by ID."""
        with self.get_connection(commit_on_success=False) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, source_url, content, content_embedding, metadata, date_added
                FROM transcripts
                WHERE id = ?
            """, (transcript_id,))
            
            row = cursor.fetchone()
            if row:
                return Transcript.from_db_row(row)
            return None
    
    def update_transcript(self, transcript_id: int, transcript_data: Dict[str, Any]) -> bool:
        """Update an existing transcript."""
        # Get current transcript to ensure it exists
        current = self.get_transcript(transcript_id)
        if not current:
            return False
        
        # Build update query based on provided fields
        update_fields = []
        params = []
        
        if 'source_url' in transcript_data:
            update_fields.append("source_url = ?")
            params.append(transcript_data['source_url'])
            
        if 'content' in transcript_data:
            update_fields.append("content = ?")
            params.append(transcript_data['content'])
            
        if 'content_embedding' in transcript_data:
            update_fields.append("content_embedding = ?")
            params.append(transcript_data['content_embedding'])
            
        if 'metadata' in transcript_data:
            update_fields.append("metadata = ?")
            params.append(json.dumps(transcript_data['metadata']))
        
        if not update_fields:
            return True  # Nothing to update
        
        # Add transcript_id to params
        params.append(transcript_id)
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute(f"""
                UPDATE transcripts
                SET {", ".join(update_fields)}
                WHERE id = ?
            """, params)
            
            return cursor.rowcount > 0
    
    def delete_transcript(self, transcript_id: int) -> bool:
        """Delete a transcript and its associated questions."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Delete associated questions first
            cursor.execute("DELETE FROM questions WHERE transcript_id = ?", (transcript_id,))
            
            # Then delete the transcript
            cursor.execute("DELETE FROM transcripts WHERE id = ?", (transcript_id,))
            
            return cursor.rowcount > 0
    
    def list_transcripts(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """List transcripts with pagination."""
        with self.get_connection(commit_on_success=False) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, source_url, content, content_embedding, metadata, date_added
                FROM transcripts
                ORDER BY date_added DESC
                LIMIT ? OFFSET ?
            """, (limit, offset))
            
            transcripts = []
            for row in cursor.fetchall():
                transcript = Transcript.from_db_row(row)
                transcripts.append(transcript.get_summary())
                
            return transcripts
    
    def search_transcripts(self, query: str) -> List[Dict[str, Any]]:
        """Search transcripts by content (basic text search)."""
        with self.get_connection(commit_on_success=False) as conn:
            cursor = conn.cursor()
            
            # Simple text search
            cursor.execute("""
                SELECT id, source_url, content, content_embedding, metadata, date_added
                FROM transcripts
                WHERE content LIKE ?
                ORDER BY date_added DESC
            """, (f"%{query}%",))
            
            transcripts = []
            for row in cursor.fetchall():
                transcript = Transcript.from_db_row(row)
                transcripts.append(transcript.get_summary())
                
            return transcripts

    # ======== Question Operations ========
    
    def add_question(self, question_data: Dict[str, Any]) -> int:
        """Add a new question to the database."""
        # Validate question data
        errors = validate_question(question_data)
        if errors:
            raise ValueError(f"Invalid question data: {', '.join(errors)}")
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Convert options to JSON
            options_json = json.dumps(question_data.get('options', []))
            
            cursor.execute("""
                INSERT INTO questions (transcript_id, question, options, answer, explanation, jlpt_level)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                question_data['transcript_id'],
                question_data['question'],
                options_json,
                question_data['answer'],
                question_data.get('explanation', ''),
                question_data.get('jlpt_level', 'N5')
            ))
            
            return cursor.lastrowid
    
    def add_questions_batch(self, questions_data: List[Dict[str, Any]]) -> List[int]:
        """Add multiple questions in a single transaction."""
        question_ids = []
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            for question_data in questions_data:
                # Validate each question
                errors = validate_question(question_data)
                if errors:
                    raise ValueError(f"Invalid question data: {', '.join(errors)}")
                
                # Convert options to JSON
                options_json = json.dumps(question_data.get('options', []))
                
                cursor.execute("""
                    INSERT INTO questions (transcript_id, question, options, answer, explanation, jlpt_level)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    question_data['transcript_id'],
                    question_data['question'],
                    options_json,
                    question_data['answer'],
                    question_data.get('explanation', ''),
                    question_data.get('jlpt_level', 'N5')
                ))
                
                question_ids.append(cursor.lastrowid)
            
        return question_ids
    
    def get_question(self, question_id: int) -> Optional[Question]:
        """Get a question by ID."""
        with self.get_connection(commit_on_success=False) as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, transcript_id, question, options, answer, explanation, jlpt_level
                FROM questions
                WHERE id = ?
            """, (question_id,))
            
            row = cursor.fetchone()
            if row:
                return Question.from_db_row(row)
            return None
    
    def get_questions_by_transcript(self, transcript_id: int, jlpt_level: Optional[str] = None) -> List[Question]:
        """Get questions for a specific transcript, optionally filtered by JLPT level."""
        with self.get_connection(commit_on_success=False) as conn:
            cursor = conn.cursor()
            
            if jlpt_level:
                cursor.execute("""
                    SELECT id, transcript_id, question, options, answer, explanation, jlpt_level
                    FROM questions
                    WHERE transcript_id = ? AND jlpt_level = ?
                    ORDER BY id
                """, (transcript_id, jlpt_level))
            else:
                cursor.execute("""
                    SELECT id, transcript_id, question, options, answer, explanation, jlpt_level
                    FROM questions
                    WHERE transcript_id = ?
                    ORDER BY id
                """, (transcript_id,))
            
            questions = []
            for row in cursor.fetchall():
                questions.append(Question.from_db_row(row))
                
            return questions
    
    def update_question(self, question_id: int, question_data: Dict[str, Any]) -> bool:
        """Update an existing question."""
        # Get current question to ensure it exists
        current = self.get_question(question_id)
        if not current:
            return False
        
        # Build update query based on provided fields
        update_fields = []
        params = []
        
        if 'question' in question_data:
            update_fields.append("question = ?")
            params.append(question_data['question'])
            
        if 'options' in question_data:
            update_fields.append("options = ?")
            params.append(json.dumps(question_data['options']))
            
        if 'answer' in question_data:
            update_fields.append("answer = ?")
            params.append(question_data['answer'])
            
        if 'explanation' in question_data:
            update_fields.append("explanation = ?")
            params.append(question_data['explanation'])
            
        if 'jlpt_level' in question_data:
            update_fields.append("jlpt_level = ?")
            params.append(question_data['jlpt_level'])
        
        if not update_fields:
            return True  # Nothing to update
        
        # Add question_id to params
        params.append(question_id)
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute(f"""
                UPDATE questions
                SET {", ".join(update_fields)}
                WHERE id = ?
            """, params)
            
            return cursor.rowcount > 0
    
    def delete_question(self, question_id: int) -> bool:
        """Delete a question."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("DELETE FROM questions WHERE id = ?", (question_id,))
            
            return cursor.rowcount > 0

    # ======== Transaction Wrappers ========
    
    def store_transcript_with_questions(self, transcript_data: Dict[str, Any], 
                                       questions_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Store a transcript and its questions in a single transaction."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Store transcript
            metadata_json = json.dumps(transcript_data.get('metadata', {}))
            embedding_bytes = transcript_data.get('content_embedding')
            
            cursor.execute("""
                INSERT INTO transcripts (source_url, content, content_embedding, metadata)
                VALUES (?, ?, ?, ?)
            """, (
                transcript_data['source_url'],
                transcript_data['content'],
                embedding_bytes,
                metadata_json
            ))
            
            transcript_id = cursor.lastrowid
            question_ids = []
            
            # Store questions
            for question_data in questions_data:
                options_json = json.dumps(question_data.get('options', []))
                
                cursor.execute("""
                    INSERT INTO questions (transcript_id, question, options, answer, explanation, jlpt_level)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    transcript_id,
                    question_data['question'],
                    options_json,
                    question_data['answer'],
                    question_data.get('explanation', ''),
                    question_data.get('jlpt_level', 'N5')
                ))
                
                question_ids.append(cursor.lastrowid)
                
        return {
            "transcript_id": transcript_id,
            "question_ids": question_ids
        }

    # ======== Backup & Restore ========
    
    def backup_database(self, backup_path: Optional[str] = None) -> str:
        """Create a backup of the database."""
        if not backup_path:
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_dir = os.path.join(os.path.dirname(self.db_path), "backups")
            os.makedirs(backup_dir, exist_ok=True)
            backup_path = os.path.join(backup_dir, f"japanese_content_{timestamp}.db")
        
        # Make sure the source database exists
        if not os.path.exists(self.db_path):
            raise FileNotFoundError(f"Database not found at {self.db_path}")
        
        # Create a copy of the database
        shutil.copy2(self.db_path, backup_path)
        
        return backup_path
    
    def restore_database(self, backup_path: str) -> bool:
        """Restore database from a backup."""
        # Make sure the backup exists
        if not os.path.exists(backup_path):
            raise FileNotFoundError(f"Backup not found at {backup_path}")
        
        # Create a backup of the current database first
        self.backup_database()
        
        # Close any open connections
        # This is best-effort; in a real app you'd want connection pooling
        try:
            with self.get_connection() as conn:
                pass
        except:
            pass
        
        # Replace the current database with the backup
        shutil.copy2(backup_path, self.db_path)
        
        return True
    
    # ======== Database Management ========
    
    def initialize_tables(self):
        """Initialize database tables if they don't exist."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Create transcripts table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS transcripts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_url TEXT,
                content TEXT,
                content_embedding BLOB,
                metadata TEXT,
                date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            ''')
            
            # Create questions table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transcript_id INTEGER,
                question TEXT,
                options TEXT,
                answer TEXT,
                explanation TEXT,
                jlpt_level TEXT,
                FOREIGN KEY (transcript_id) REFERENCES transcripts (id)
            )
            ''')
            
            # Create user_progress table (optional, for future use)
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
            )
            ''')
            
            # Create indexes for better performance
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_transcripts_date ON transcripts(date_added)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_questions_transcript_id ON questions(transcript_id)')
            
            return True

    def get_database_stats(self) -> Dict[str, Any]:
        """Get statistics about the database."""
        with self.get_connection(commit_on_success=False) as conn:
            cursor = conn.cursor()
            
            # Get transcript count
            cursor.execute("SELECT COUNT(*) FROM transcripts")
            transcript_count = cursor.fetchone()[0]
            
            # Get question count
            cursor.execute("SELECT COUNT(*) FROM questions")
            question_count = cursor.fetchone()[0]
            
            # Get JLPT level distribution
            cursor.execute("""
                SELECT jlpt_level, COUNT(*) 
                FROM questions 
                GROUP BY jlpt_level 
                ORDER BY jlpt_level
            """)
            jlpt_distribution = {row[0]: row[1] for row in cursor.fetchall()}
            
            # Get database size
            db_size_bytes = os.path.getsize(self.db_path)
            db_size_mb = db_size_bytes / (1024 * 1024)
            
            return {
                "transcript_count": transcript_count,
                "question_count": question_count,
                "jlpt_level_distribution": jlpt_distribution,
                "database_size_bytes": db_size_bytes,
                "database_size_mb": round(db_size_mb, 2),
                "database_path": self.db_path,
                "last_modified": datetime.datetime.fromtimestamp(
                    os.path.getmtime(self.db_path)
                ).strftime("%Y-%m-%d %H:%M:%S")
            }


# Example usage
if __name__ == "__main__":
    db_ops = DatabaseOperations()
    
    # Initialize tables
    db_ops.initialize_tables()
    
    # Example: Add a transcript
    transcript_id = db_ops.add_transcript({
        "source_url": "https://example.com/video123",
        "content": "日本語の勉強は楽しいです。毎日練習しています。",
        "metadata": {
            "title": "日本語の勉強",
            "duration": 120,
            "video_id": "video123"
        }
    })
    
    print(f"Added transcript with ID: {transcript_id}")
    
    # Example: Add questions for the transcript
    questions = [
        {
            "transcript_id": transcript_id,
            "question": "何が楽しいですか？",
            "options": ["日本語の勉強", "料理", "旅行", "音楽"],
            "answer": "日本語の勉強",
            "explanation": "「日本語の勉強は楽しいです」と言っています。",
            "jlpt_level": "N5"
        },
        {
            "transcript_id": transcript_id,
            "question": "どのくらいの頻度で練習していますか？",
            "options": ["毎日", "週に一回", "月に一回", "時々"],
            "answer": "毎日",
            "explanation": "「毎日練習しています」と言っています。",
            "jlpt_level": "N5"
        }
    ]
    
    question_ids = db_ops.add_questions_batch(questions)
    print(f"Added questions with IDs: {question_ids}")
    
    # Get transcript and its questions
    transcript = db_ops.get_transcript(transcript_id)
    print(f"Retrieved transcript: {transcript.to_dict()}")
    
    transcript_questions = db_ops.get_questions_by_transcript(transcript_id)
    print(f"Retrieved {len(transcript_questions)} questions")
    
    # Get database stats
    stats = db_ops.get_database_stats()
    print(f"Database stats: {stats}")
