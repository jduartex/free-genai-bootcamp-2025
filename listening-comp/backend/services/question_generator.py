import openai
import logging

logger = logging.getLogger(__name__)

# ...existing code...

def generate_questions(transcript, level, num_questions=5):
    try:
        # Update the OpenAI API call to use the new format for v1.0.0
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",  # or the model you're using
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates language learning questions."},
                {"role": "user", "content": f"Generate {num_questions} questions for JLPT level {level} based on this transcript: {transcript}"}
            ],
            temperature=0.7,
        )
        
        # Extract content from the new API response structure
        questions = response.choices[0].message.content
        return process_questions(questions)  # Assuming this function exists
    except Exception as e:
        logger.error(f"Failed to generate questions: {e}")
        return get_fallback_questions(level, num_questions)

# ...existing code...