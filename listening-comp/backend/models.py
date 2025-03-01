import json
import datetime
from dataclasses import dataclass, asdict, field
from typing import List, Dict, Any, Optional, Union

@dataclass
class Transcript:
    """Model representing a Japanese transcript."""
    content: str
    source_url: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    content_embedding: Optional[bytes] = None
    id: Optional[int] = None
    date_added: Optional[str] = None
    
    @classmethod
    def from_db_row(cls, row):
        """Create a Transcript instance from a database row."""
        if len(row) < 6:  # Check if the row has enough elements
            raise ValueError(f"Expected at least 6 elements in database row, got {len(row)}")
            
        return cls(
            id=row[0],
            source_url=row[1],
            content=row[2],
            content_embedding=row[3],
            metadata=json.loads(row[4]) if row[4] else {},
            date_added=row[5]
        )
    
    def to_dict(self):
        """Convert to dictionary, excluding the embedding."""
        data = asdict(self)
        # Remove the embedding as it's not JSON serializable
        if 'content_embedding' in data:
            del data['content_embedding']
        return data
    
    def get_summary(self):
        """Get a brief summary of the transcript."""
        content_preview = self.content[:100] + "..." if len(self.content) > 100 else self.content
        return {
            "id": self.id,
            "source_url": self.source_url,
            "content_preview": content_preview,
            "date_added": self.date_added,
            "metadata": self.metadata
        }

@dataclass
class Question:
    """Model representing a question related to a transcript."""
    transcript_id: int
    question: str
    options: List[str]
    answer: str
    explanation: str
    jlpt_level: str
    id: Optional[int] = None
    
    @classmethod
    def from_db_row(cls, row):
        """Create a Question instance from a database row."""
        if len(row) < 7:  # Check if the row has enough elements
            raise ValueError(f"Expected 7 elements in database row, got {len(row)}")
            
        return cls(
            id=row[0],
            transcript_id=row[1],
            question=row[2],
            options=json.loads(row[3]) if isinstance(row[3], str) else row[3],
            answer=row[4],
            explanation=row[5],
            jlpt_level=row[6]
        )
    
    def to_dict(self):
        """Convert to dictionary."""
        return asdict(self)

@dataclass
class UserProgress:
    """Model representing user progress (optional for future use)."""
    user_id: str
    transcript_id: int
    questions_attempted: int
    questions_correct: int
    last_access: str
    completion_time: Optional[int] = None
    jlpt_level: str = "N5"
    notes: Optional[str] = None
    id: Optional[int] = None
    
    @classmethod
    def from_db_row(cls, row):
        """Create a UserProgress instance from a database row."""
        return cls(
            id=row[0],
            user_id=row[1],
            transcript_id=row[2],
            questions_attempted=row[3],
            questions_correct=row[4],
            last_access=row[5],
            completion_time=row[6],
            jlpt_level=row[7],
            notes=row[8]
        )
    
    def to_dict(self):
        """Convert to dictionary."""
        return asdict(self)

# Model validation functions
def validate_transcript(transcript: Dict[str, Any]) -> List[str]:
    """Validate transcript data."""
    errors = []
    
    if not transcript.get('content'):
        errors.append("Transcript content is required")
    
    if not transcript.get('source_url'):
        errors.append("Transcript source URL is required")
    
    return errors

def validate_question(question: Dict[str, Any]) -> List[str]:
    """Validate question data."""
    errors = []
    
    if not question.get('transcript_id'):
        errors.append("Question must be associated with a transcript")
    
    if not question.get('question'):
        errors.append("Question text is required")
    
    if not question.get('options') or len(question.get('options', [])) < 2:
        errors.append("Question must have at least 2 options")
    
    if not question.get('answer'):
        errors.append("Question answer is required")
    
    if question.get('answer') and question.get('options') and question.get('answer') not in question.get('options'):
        errors.append("Answer must be one of the options")
    
    valid_jlpt_levels = ["N5", "N4", "N3", "N2", "N1"]
    if question.get('jlpt_level') and question.get('jlpt_level') not in valid_jlpt_levels:
        errors.append(f"JLPT level must be one of: {', '.join(valid_jlpt_levels)}")
    
    return errors
