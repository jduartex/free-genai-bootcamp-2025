import openai
import logging
from typing import List, Dict

async def generate_questions(level: str, count: int = 2) -> List[Dict]:
    try:
        response = await openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{
                "role": "user",
                "content": f"Generate {count} JLPT {level} level questions"
            }]
        )
        return response.choices[0].message.content
    except Exception as e:
        logging.error(f"Failed to generate questions: {str(e)}")
        return get_fallback_questions(level)

def get_fallback_questions(level: str) -> List[Dict]:
    return [
        {"question": "Basic question 1", "level": level},
        {"question": "Basic question 2", "level": level}
    ]
