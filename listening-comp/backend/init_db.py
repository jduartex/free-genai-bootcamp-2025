import sqlite3
import os
import json

def create_db():
    """Initialize the SQLite database with vector extension for Japanese content"""
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../data/japanese_content.db")
    
    # Ensure the data directory exists
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    # Connect to the database (creates it if it doesn't exist)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create tables
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
    
    # Create user_progress table for tracking learning progress
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
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id)')
    
    conn.commit()
    conn.close()
    
    print("Database initialized successfully at:", db_path)

if __name__ == "__main__":
    create_db()
