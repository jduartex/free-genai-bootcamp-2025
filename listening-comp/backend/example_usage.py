"""
Example script demonstrating how to use the database operations and models.
This file shows common usage patterns for the CRUD operations.
"""
import os
import json
from datetime import datetime
import sys
import os

# Add parent directory to path to make imports work correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.models import Transcript, Question
from backend.db_operations import DatabaseOperations
from backend.vector_db import JapaneseVectorDB

def main():
    print("===== Japanese Listening Comprehension App Database Operations Demo =====")
    
    # Initialize database operations
    db_ops = DatabaseOperations()
    
    # Make sure the database tables exist
    db_ops.initialize_tables()
    
    # Create a vector DB instance for generating embeddings
    vector_db = JapaneseVectorDB()
    
    # Example Japanese transcripts
    transcripts = [
        {
            "source_url": "https://www.youtube.com/watch?v=example1",
            "content": "日本語の勉強は大切です。毎日少しずつ練習すると、上手になります。言語を学ぶには時間がかかりますが、諦めないでください。",
            "metadata": {
                "title": "日本語学習のコツ",
                "duration": 120,
                "author": "日本語先生",
                "tags": ["JLPT", "beginner", "study tips"]
            }
        },
        {
            "source_url": "https://www.youtube.com/watch?v=example2",
            "content": "東京は日本の首都です。とても大きな都市で、多くの人が住んでいます。東京には有名な場所がたくさんあります。例えば、東京タワー、渋谷、新宿などです。",
            "metadata": {
                "title": "東京について",
                "duration": 180,
                "author": "旅行ガイド",
                "tags": ["travel", "Tokyo", "sightseeing"]
            }
        }
    ]
    
    print("\n1. Adding transcripts with embeddings...")
    transcript_ids = []
    for transcript_data in transcripts:
        # Generate embedding for the content
        embedding = vector_db.generate_embedding(transcript_data["content"])
        transcript_data["content_embedding"] = embedding
        
        # Add to database
        transcript_id = db_ops.add_transcript(transcript_data)
        transcript_ids.append(transcript_id)
        print(f"  - Added transcript ID {transcript_id}: {transcript_data['metadata']['title']}")
    
    print("\n2. Creating questions for transcripts...")
    # Add questions for the first transcript
    questions_1 = [
        {
            "transcript_id": transcript_ids[0],
            "question": "日本語の勉強について何が大切ですか？",
            "options": ["毎日少しずつ練習すること", "一日中勉強すること", "文法だけ勉強すること", "漢字だけ覚えること"],
            "answer": "毎日少しずつ練習すること",
            "explanation": "「毎日少しずつ練習すると、上手になります」と言っています。",
            "jlpt_level": "N5"
        },
        {
            "transcript_id": transcript_ids[0],
            "question": "言語を学ぶのはどうですか？",
            "options": ["時間がかかる", "簡単だ", "お金がかかる", "必要ない"],
            "answer": "時間がかかる",
            "explanation": "「言語を学ぶには時間がかかります」と言っています。",
            "jlpt_level": "N5"
        }
    ]
    
    # Add questions for the second transcript
    questions_2 = [
        {
            "transcript_id": transcript_ids[1],
            "question": "東京は何ですか？",
            "options": ["日本の首都", "日本の古い首都", "大きな村", "小さな都市"],
            "answer": "日本の首都",
            "explanation": "「東京は日本の首都です」と言っています。",
            "jlpt_level": "N5"
        },
        {
            "transcript_id": transcript_ids[1],
            "question": "東京はどんな都市ですか？",
            "options": ["大きな都市", "小さな都市", "静かな都市", "古い都市"],
            "answer": "大きな都市",
            "explanation": "「とても大きな都市」と言っています。",
            "jlpt_level": "N5"
        }
    ]
    
    # Store questions in database
    q1_ids = db_ops.add_questions_batch(questions_1)
    q2_ids = db_ops.add_questions_batch(questions_2)
    
    print(f"  - Added {len(q1_ids)} questions for transcript 1")
    print(f"  - Added {len(q2_ids)} questions for transcript 2")
    
    print("\n3. Retrieving transcript and questions...")
    # Get transcript by ID
    transcript = db_ops.get_transcript(transcript_ids[0])
    print(f"Transcript: {transcript.get_summary()}")
    
    # Get questions by transcript ID
    questions = db_ops.get_questions_by_transcript(transcript_ids[0])
    print(f"Found {len(questions)} questions:")
    for i, q in enumerate(questions, 1):
        print(f"  Q{i}: {q.question}")
        print(f"    Options: {q.options}")
        print(f"    Answer: {q.answer}")
    
    print("\n4. Updating a transcript...")
    # Update the first transcript's metadata
    update_data = {
        "metadata": {
            "title": "日本語学習のコツ - 更新版",
            "duration": 120,
            "author": "日本語先生",
            "tags": ["JLPT", "beginner", "study tips", "updated"],
            "updated_at": datetime.now().isoformat()
        }
    }
    db_ops.update_transcript(transcript_ids[0], update_data)
    
    # Get the updated transcript
    updated_transcript = db_ops.get_transcript(transcript_ids[0])
    print(f"Updated transcript: {updated_transcript.get_summary()}")
    
    print("\n5. Database statistics:")
    # Get database stats
    stats = db_ops.get_database_stats()
    print(f"  - Total transcripts: {stats['transcript_count']}")
    print(f"  - Total questions: {stats['question_count']}")
    print(f"  - JLPT distribution: {stats['jlpt_level_distribution']}")
    print(f"  - Database size: {stats['database_size_mb']} MB")
    print(f"  - Last modified: {stats['last_modified']}")
    
    print("\n6. Creating a backup...")
    # Create a database backup
    backup_path = db_ops.backup_database()
    print(f"  - Backup created at: {backup_path}")
    
    print("\nDemo completed successfully!")

if __name__ == "__main__":
    main()