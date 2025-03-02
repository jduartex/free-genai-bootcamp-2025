import sqlite3
import os
import json
from datetime import datetime
import time

class ProgressTracker:
    """Class for tracking user progress in Japanese listening comprehension."""
    
    def __init__(self, db_path=None):
        """Initialize with database path."""
        if db_path is None:
            # Use default path relative to this file
            self.db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                                      "data/japanese_content.db")
        else:
            self.db_path = db_path
            
        # Default user ID for single-user mode
        self.default_user_id = "default_user"
    
    def connect(self):
        """Connect to the SQLite database."""
        return sqlite3.connect(self.db_path)
    
    def start_transcript_session(self, transcript_id, jlpt_level=None):
        """Start tracking a session for a transcript."""
        user_id = self.default_user_id
        timestamp = datetime.now().isoformat()
        
        conn = self.connect()
        cursor = conn.cursor()
        
        # Check if there's an existing record
        cursor.execute("""
            SELECT id FROM user_progress 
            WHERE user_id = ? AND transcript_id = ?
        """, (user_id, transcript_id))
        
        record = cursor.fetchone()
        
        if record:
            # Update existing record
            cursor.execute("""
                UPDATE user_progress 
                SET last_access = ?, jlpt_level = ?
                WHERE id = ?
            """, (timestamp, jlpt_level or "unknown", record[0]))
            progress_id = record[0]
        else:
            # Create new record
            cursor.execute("""
                INSERT INTO user_progress 
                (user_id, transcript_id, last_access, questions_attempted, 
                questions_correct, jlpt_level)
                VALUES (?, ?, ?, 0, 0, ?)
            """, (user_id, transcript_id, timestamp, jlpt_level or "unknown"))
            progress_id = cursor.lastrowid
        
        conn.commit()
        conn.close()
        
        return {
            "progress_id": progress_id,
            "user_id": user_id,
            "transcript_id": transcript_id,
            "started_at": timestamp
        }
    
    def update_question_result(self, transcript_id, is_correct, question_id=None, response_time=None):
        """Update progress with question result."""
        user_id = self.default_user_id
        
        conn = self.connect()
        cursor = conn.cursor()
        
        # Get the current progress record
        cursor.execute("""
            SELECT id, questions_attempted, questions_correct 
            FROM user_progress 
            WHERE user_id = ? AND transcript_id = ?
        """, (user_id, transcript_id))
        
        record = cursor.fetchone()
        
        if not record:
            # Create new record if doesn't exist
            cursor.execute("""
                INSERT INTO user_progress 
                (user_id, transcript_id, questions_attempted, questions_correct)
                VALUES (?, ?, 1, ?)
            """, (user_id, transcript_id, 1 if is_correct else 0))
            progress_id = cursor.lastrowid
            questions_attempted = 1
            questions_correct = 1 if is_correct else 0
        else:
            progress_id, questions_attempted, questions_correct = record
            questions_attempted += 1
            if is_correct:
                questions_correct += 1
                
            # Update existing record
            cursor.execute("""
                UPDATE user_progress 
                SET questions_attempted = ?, questions_correct = ?, last_access = ?
                WHERE id = ?
            """, (questions_attempted, questions_correct, datetime.now().isoformat(), progress_id))
        
        # Store detailed question result in a separate table if we want to track individual questions
        if question_id:
            # Store in a question_attempts table - this would need to be created in init_db.py
            # For now, we'll just print a message
            print(f"Detailed tracking: Question {question_id} answered {'correctly' if is_correct else 'incorrectly'}")
        
        conn.commit()
        conn.close()
        
        return {
            "progress_id": progress_id,
            "questions_attempted": questions_attempted,
            "questions_correct": questions_correct,
            "accuracy": round(questions_correct / questions_attempted * 100, 2) if questions_attempted > 0 else 0
        }
    
    def complete_transcript_session(self, transcript_id, completion_time=None, notes=None):
        """Mark a transcript session as completed."""
        user_id = self.default_user_id
        
        # If completion_time not provided, estimate based on questions
        if completion_time is None:
            completion_time = 0  # Default value
        
        conn = self.connect()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE user_progress 
            SET completion_time = ?, notes = ?
            WHERE user_id = ? AND transcript_id = ?
        """, (completion_time, notes or "", user_id, transcript_id))
        
        conn.commit()
        conn.close()
        
        return self.get_progress_for_transcript(transcript_id)
    
    def get_progress_for_transcript(self, transcript_id):
        """Get progress data for a specific transcript."""
        user_id = self.default_user_id
        
        conn = self.connect()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, questions_attempted, questions_correct, 
                   last_access, completion_time, jlpt_level, notes
            FROM user_progress 
            WHERE user_id = ? AND transcript_id = ?
        """, (user_id, transcript_id))
        
        record = cursor.fetchone()
        conn.close()
        
        if not record:
            return None
        
        progress_id, questions_attempted, questions_correct, last_access, \
            completion_time, jlpt_level, notes = record
        
        accuracy = round(questions_correct / questions_attempted * 100, 2) if questions_attempted > 0 else 0
        
        return {
            "progress_id": progress_id,
            "transcript_id": transcript_id,
            "questions_attempted": questions_attempted,
            "questions_correct": questions_correct,
            "accuracy": accuracy,
            "last_access": last_access,
            "completion_time": completion_time,
            "jlpt_level": jlpt_level,
            "notes": notes
        }
    
    def get_all_progress(self, limit=50, order_by="last_access", desc=True):
        """Get all progress entries, with optional filtering and sorting."""
        user_id = self.default_user_id
        
        conn = self.connect()
        cursor = conn.cursor()
        
        # Get basic progress data
        cursor.execute(f"""
            SELECT p.id, p.transcript_id, p.questions_attempted, p.questions_correct, 
                   p.last_access, p.completion_time, p.jlpt_level, p.notes,
                   t.source_url, t.metadata
            FROM user_progress p
            LEFT JOIN transcripts t ON p.transcript_id = t.id
            WHERE p.user_id = ?
            ORDER BY p.{order_by} {"DESC" if desc else "ASC"}
            LIMIT ?
        """, (user_id, limit))
        
        records = cursor.fetchall()
        conn.close()
        
        progress_list = []
        
        for record in records:
            progress_id, transcript_id, questions_attempted, questions_correct, \
                last_access, completion_time, jlpt_level, notes, \
                source_url, metadata = record
            
            accuracy = round(questions_correct / questions_attempted * 100, 2) if questions_attempted > 0 else 0
            
            # Parse metadata JSON
            try:
                metadata_dict = json.loads(metadata) if metadata else {}
            except:
                metadata_dict = {}
            
            progress_list.append({
                "progress_id": progress_id,
                "transcript_id": transcript_id,
                "questions_attempted": questions_attempted,
                "questions_correct": questions_correct,
                "accuracy": accuracy,
                "last_access": last_access,
                "completion_time": completion_time,
                "jlpt_level": jlpt_level,
                "notes": notes,
                "source_url": source_url,
                "transcript_title": metadata_dict.get("title", "Unknown title")
            })
        
        return progress_list
    
    def get_progress_summary(self):
        """Get summary statistics of user progress."""
        user_id = self.default_user_id
        
        conn = self.connect()
        cursor = conn.cursor()
        
        # Get aggregate statistics
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT transcript_id) as transcripts_studied,
                SUM(questions_attempted) as total_questions_attempted,
                SUM(questions_correct) as total_questions_correct,
                SUM(completion_time) as total_time_spent,
                COUNT(DISTINCT CASE WHEN completion_time > 0 THEN transcript_id END) as completed_transcripts,
                MAX(last_access) as last_study_date
            FROM user_progress
            WHERE user_id = ?
        """, (user_id,))
        
        record = cursor.fetchone()
        
        if not record or record[0] == 0:  # No data or zero transcripts
            conn.close()
            return {
                "transcripts_studied": 0,
                "total_questions": 0,
                "overall_accuracy": 0,
                "total_time_spent_minutes": 0,
                "completed_transcripts": 0,
                "last_study_date": None,
                "jlpt_breakdown": {}
            }
        
        transcripts_studied, total_questions, total_correct, \
            total_time, completed_transcripts, last_study_date = record
            
        # Get breakdown by JLPT level
        cursor.execute("""
            SELECT 
                jlpt_level,
                COUNT(DISTINCT transcript_id) as transcripts,
                SUM(questions_attempted) as questions,
                SUM(questions_correct) as correct_answers
            FROM user_progress
            WHERE user_id = ? AND jlpt_level IS NOT NULL
            GROUP BY jlpt_level
            ORDER BY jlpt_level
        """, (user_id,))
        
        jlpt_records = cursor.fetchall()
        conn.close()
        
        # Calculate overall accuracy
        overall_accuracy = round(total_correct / total_questions * 100, 2) if total_questions > 0 else 0
        
        # Format JLPT breakdown
        jlpt_breakdown = {}
        for jlpt_record in jlpt_records:
            jlpt_level, jlpt_transcripts, jlpt_questions, jlpt_correct = jlpt_record
            jlpt_accuracy = round(jlpt_correct / jlpt_questions * 100, 2) if jlpt_questions > 0 else 0
            
            jlpt_breakdown[jlpt_level] = {
                "transcripts": jlpt_transcripts,
                "questions": jlpt_questions,
                "accuracy": jlpt_accuracy
            }
        
        return {
            "transcripts_studied": transcripts_studied,
            "total_questions": total_questions,
            "overall_accuracy": overall_accuracy,
            "total_time_spent_minutes": round(total_time / 60) if total_time else 0,
            "completed_transcripts": completed_transcripts,
            "last_study_date": last_study_date,
            "jlpt_breakdown": jlpt_breakdown
        }
    
    def reset_progress(self, transcript_id=None):
        """Reset progress for a transcript or all transcripts."""
        user_id = self.default_user_id
        
        conn = self.connect()
        cursor = conn.cursor()
        
        if transcript_id:
            # Reset specific transcript
            cursor.execute("""
                DELETE FROM user_progress
                WHERE user_id = ? AND transcript_id = ?
            """, (user_id, transcript_id))
        else:
            # Reset all progress
            cursor.execute("""
                DELETE FROM user_progress
                WHERE user_id = ?
            """, (user_id,))
        
        conn.commit()
        conn.close()
        
        return {"reset": True, "transcript_id": transcript_id}

# Example usage
if __name__ == "__main__":
    tracker = ProgressTracker()
    
    # Example: Start a session
    print("Starting a new session...")
    session = tracker.start_transcript_session(1, jlpt_level="N4")
    print(f"Session started: {session}")
    
    # Example: Record question results
    print("\nRecording question results...")
    q1_result = tracker.update_question_result(1, True)
    print(f"After Q1 (correct): {q1_result}")
    
    q2_result = tracker.update_question_result(1, False)
    print(f"After Q2 (incorrect): {q2_result}")
    
    q3_result = tracker.update_question_result(1, True)
    print(f"After Q3 (correct): {q3_result}")
    
    # Example: Complete the session
    print("\nCompleting the session...")
    completion = tracker.complete_transcript_session(1, completion_time=320, 
                                                  notes="Struggled with passive form")
    print(f"Session completed: {completion}")
    
    # Example: Get progress summary
    print("\nProgress summary:")
    summary = tracker.get_progress_summary()
    print(json.dumps(summary, indent=2))
