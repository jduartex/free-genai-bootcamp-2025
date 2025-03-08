import logging
import openai
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class QuestionGenerator:
    def __init__(self, api_key: str):
        openai.api_key = api_key
        
    def generate_questions(self, transcript: str, level: str, num_questions: int = 5) -> List[Dict[str, Any]]:
        """Generate questions based on transcript and JLPT level."""
        try:
            # Fix for newer OpenAI API
            # Check if we should use the new client-based approach or legacy
            if hasattr(openai, 'OpenAI'):
                # New client API style
                client = openai.OpenAI(api_key=openai.api_key)
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": f"Generate {num_questions} questions for JLPT level {level} based on this transcript."},
                        {"role": "user", "content": transcript}
                    ]
                )
                content = response.choices[0].message.content
            else:
                # Legacy API style
                response = openai.Completion.create(
                    engine="text-davinci-003",
                    prompt=f"Generate {num_questions} questions for JLPT level {level} based on this transcript:\n{transcript}",
                    max_tokens=500,
                    temperature=0.7
                )
                content = response.choices[0].text
            
            # Process the response to extract questions
            questions = self._parse_questions(content)
            logger.info(f"Successfully generated {len(questions)} questions")
            return questions
            
        except Exception as e:
            logger.error(f"Failed to generate questions: {str(e)}")
            return self._get_fallback_questions(level)
    
    def _parse_questions(self, content: str) -> List[Dict[str, Any]]:
        """Parse the generated content into structured questions."""
        # Simple implementation - would need more robust parsing in production
        lines = content.strip().split('\n')
        questions = []
        current_question = None
        
        for line in lines:
            if line.startswith('Q:') or line.startswith('Question:'):
                if current_question:
                    questions.append(current_question)
                current_question = {"question": line.split(':', 1)[1].strip(), "options": [], "answer": ""}
            elif line.startswith('A:') or line.startswith('Answer:'):
                if current_question:
                    current_question["answer"] = line.split(':', 1)[1].strip()
            elif line.startswith(('1.', '2.', '3.', '4.', 'a)', 'b)', 'c)', 'd)')):
                if current_question:
                    current_question["options"].append(line.strip())
        
        if current_question:
            questions.append(current_question)
            
        return questions
    
    def _get_fallback_questions(self, level: str) -> List[Dict[str, Any]]:
        """Provide fallback questions when API fails."""
        logger.info(f"Using fallback questions for level {level}")
        
        # Simple fallback questions for various JLPT levels
        fallbacks = {
            "N5": [
                {
                    "question": "何時ですか？",
                    "options": ["1. 3時です", "2. 火曜日です", "3. 晴れです", "4. 東京です"],
                    "answer": "1"
                },
                {
                    "question": "日本語を勉強していますか？",
                    "options": ["1. はい、勉強しています", "2. いいえ、食べません", "3. はい、行きます", "4. いいえ、知りません"],
                    "answer": "1"
                }
            ],
            # Add fallbacks for other levels as needed
        }
        
        return fallbacks.get(level, [
            {
                "question": "Sample fallback question",
                "options": ["1. Option 1", "2. Option 2", "3. Option 3", "4. Option 4"],
                "answer": "1"
            }
        ])
