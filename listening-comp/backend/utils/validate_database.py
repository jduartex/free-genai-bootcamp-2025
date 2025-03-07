import os
import sqlite3
import sys
import sqlite_vss  # Add explicit import

def validate_sqlite_vector_extension():
    """Check if SQLite has the vector extension enabled."""
    print("🔍 Validating SQLite vector extension...")
    
    try:
        # Create a temporary database in memory
        conn = sqlite3.connect(':memory:')
        
        # Enable extension loading and load using sqlite_vss
        try:
            conn.enable_load_extension(True)
            sqlite_vss.load(conn)  # Use the package's load function
            
            # Verify the extension loaded by checking version
            version = conn.execute("SELECT vss_version()").fetchone()[0]
            print(f"✅ Vector extension loaded successfully (version: {version})")
            
            # Create test virtual table
            conn.execute("CREATE VIRTUAL TABLE temp_vss_test USING vss0(vec(3))")
            print("✅ Virtual table creation works")
            
            return True
            
        except sqlite3.OperationalError as e:
            print(f"❌ Vector extension loading failed: {e}")
            print("ℹ️ Make sure sqlite-vss is installed: pip install sqlite-vss")
            return False
            
    except Exception as e:
        print(f"❌ SQLite validation failed: {str(e)}")
        return False

def test_database_schema():
    """Test if the database schema can be created successfully."""
    print("🔍 Testing database schema creation...")
    
    db_path = 'test_japanese_app.db'
    try:
        # Create a test database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create tables
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS japanese_content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id TEXT NOT NULL,
            source_type TEXT NOT NULL,
            title TEXT,
            transcript TEXT NOT NULL,
            transcript_embedding BLOB,
            jlpt_level TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content_id INTEGER NOT NULL,
            question_text TEXT NOT NULL,
            audio_path TEXT,
            jlpt_level TEXT,
            question_type TEXT,
            FOREIGN KEY (content_id) REFERENCES japanese_content(id)
        )''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER NOT NULL,
            answer_text TEXT NOT NULL,
            is_correct BOOLEAN NOT NULL,
            explanation TEXT,
            FOREIGN KEY (question_id) REFERENCES questions(id)
        )''')
        
        # Test inserting sample data
        cursor.execute('''
        INSERT INTO japanese_content (source_id, source_type, title, transcript, jlpt_level)
        VALUES (?, ?, ?, ?, ?)
        ''', ('test_video_id', 'youtube', 'Test Japanese Video', 'こんにちは、テストです。', 'N5'))
        
        conn.commit()
        conn.close()
        
        print("✅ Database schema created successfully")
        return True
        
    except Exception as e:
        print(f"❌ Database schema test failed: {str(e)}")
        return False
    finally:
        # Clean up the test database
        if os.path.exists(db_path):
            try:
                os.remove(db_path)
            except:
                pass

if __name__ == "__main__":
    vector_result = validate_sqlite_vector_extension()
    schema_result = test_database_schema()
    
    if vector_result and schema_result:
        print("✅ Database validation successful")
        sys.exit(0)
    else:
        print("❌ Database validation failed")
        sys.exit(1)
