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
    
    conn.commit()
    conn.close()
    
    print("Database initialized successfully at:", db_path)

if __name__ == "__main__":
    create_db()
