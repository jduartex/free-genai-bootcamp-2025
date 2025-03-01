import os
import json
import asyncio
from typing import List, Dict, Any, Optional
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class QuestionGenerator:
    """
    LLM Agent for generating Japanese comprehension questions from content
    """
    
    def __init__(self):
        """Initialize the question generator with API key"""
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key not found. Please set the OPENAI_API_KEY environment variable.")
            
        # Set the API key for OpenAI client
        self.client = openai.OpenAI(api_key=self.api_key)
        
        # Define JLPT levels and their characteristics
        self.jlpt_levels = {
            "N5": {
                "vocab_range": "800-1000 words",
                "kanji": "100-200 kanji",
                "grammar": "basic structures",
                "description": "Basic Japanese, can understand simple conversations"
            },
            "N4": {
                "vocab_range": "1500-2000 words",
                "kanji": "300-400 kanji",
                "grammar": "basic to intermediate structures",
                "description": "Basic Japanese, can handle everyday conversations"
            },
            "N3": {
                "vocab_range": "3000-3500 words",
                "kanji": "600-700 kanji",
                "grammar": "intermediate structures",
                "description": "Intermediate Japanese, can understand daily situations"
            },
            "N2": {
                "vocab_range": "6000-8000 words",
                "kanji": "1000-1200 kanji",
                "grammar": "advanced structures",
                "description": "Pre-advanced Japanese, can read newspapers with some difficulty"
            },
            "N1": {
                "vocab_range": "10000+ words",
                "kanji": "2000+ kanji",
                "grammar": "complex structures",
                "description": "Advanced Japanese, close to native fluency"
            }
        }
    
    async def generate(self, 
                       transcript: str, 
                       jlpt_level: str = "N4",
                       num_questions: int = 5,
                       include_answers: bool = True) -> List[Dict[str, Any]]:
        """
        Generate Japanese comprehension questions for a transcript
        
        Args:
            transcript: Text transcript to generate questions from
            jlpt_level: JLPT level (N1-N5) to target
            num_questions: Number of questions to generate
            include_answers: Whether to include answers
            
        Returns:
            List of question objects with question text, answer options, and correct answers
        """
        # Clean and truncate the transcript if it's too long
        max_length = 4000  # Adjust based on token limits and safety margin
        if len(transcript) > max_length:
            transcript = transcript[:max_length] + "..."
        
        # Create the prompt based on JLPT level
        system_prompt = self._create_system_prompt(jlpt_level)
        
        user_prompt = f"""
        Japanese transcript:
        {transcript}
        
        Generate {num_questions} Japanese listening comprehension questions based on this transcript.
        Target JLPT level: {jlpt_level}
        
        For each question, provide:
        1. The question in Japanese
        2. The question in English translation
        3. 4 multiple-choice options in Japanese
        4. The correct answer
        5. An explanation of the answer in English
        
        Format the output as a valid JSON array where each question is an object.
        """
        
        try:
            # Call the OpenAI API
            response = await self._call_openai_api(system_prompt, user_prompt)
            
            # Parse the response to extract the questions
            questions = self._parse_response(response, include_answers)
            
            return questions
            
        except Exception as e:
            raise Exception(f"Failed to generate questions: {str(e)}")
    
    async def get_by_jlpt_level(self, jlpt_level: str) -> Dict[str, Any]:
        """
        Get information and sample questions for a specific JLPT level
        
        Args:
            jlpt_level: JLPT level (N1-N5)
            
        Returns:
            Information about the JLPT level and sample questions
        """
        if jlpt_level not in self.jlpt_levels:
            raise ValueError(f"Invalid JLPT level: {jlpt_level}. Must be one of: N1, N2, N3, N4, N5")
            
        level_info = self.jlpt_levels[jlpt_level]
        
        # Generate a few sample questions for this level
        sample_prompt = f"""
        Generate 2 sample Japanese listening comprehension questions at JLPT level {jlpt_level}.
        Create fictional dialogue snippets as context, then questions about them.
        
        For each question, provide:
        1. A short dialogue context in Japanese
        2. The question in Japanese
        3. The question in English translation
        4. 4 multiple-choice options in Japanese
        5. The correct answer
        6. An explanation of the answer in English
        
        Format the output as a valid JSON array where each question is an object.
        """
        
        system_prompt = self._create_system_prompt(jlpt_level)
        
        try:
            # Call the OpenAI API
            response = await self._call_openai_api(system_prompt, sample_prompt)
            
            # Parse the response to extract the questions
            sample_questions = self._parse_response(response, True)
            
            return {
                "jlpt_level": jlpt_level,
                "level_info": level_info,
                "sample_questions": sample_questions
            }
            
        except Exception as e:
            raise Exception(f"Failed to generate sample questions: {str(e)}")
    
    async def _call_openai_api(self, system_prompt: str, user_prompt: str) -> str:
        """Call the OpenAI API with the given prompts"""
        try:
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model="gpt-4o",  # Using GPT-4o for best Japanese language capabilities
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            raise Exception(f"OpenAI API call failed: {str(e)}")
    
    def _create_system_prompt(self, jlpt_level: str) -> str:
        """Create a system prompt based on the JLPT level"""
        level_info = self.jlpt_levels.get(jlpt_level, self.jlpt_levels["N4"])
        
        return f"""
        You are an expert Japanese language teacher specializing in creating listening comprehension questions.
        
        Your task is to generate questions appropriate for JLPT {jlpt_level} level students.
        
        JLPT {jlpt_level} level characteristics:
        - Vocabulary range: {level_info['vocab_range']}
        - Kanji knowledge: {level_info['kanji']}
        - Grammar complexity: {level_info['grammar']}
        - {level_info['description']}
        
        Guidelines:
        1. Make questions that accurately test listening comprehension at JLPT {jlpt_level} level
        2. Use vocabulary and grammar appropriate for this level
        3. Create clear and unambiguous questions
        4. Ensure questions cover different aspects of comprehension: main idea, details, inference, etc.
        5. Make the incorrect options plausible but clearly incorrect
        6. Focus on natural Japanese usage that would appear in real conversations
        7. Include cultural context where relevant
        
        Format your output as a valid JSON object with an array of question objects.
        """
    
    def _parse_response(self, response_text: str, include_answers: bool) -> List[Dict[str, Any]]:
        """Parse the API response to extract questions"""
        try:
            # Parse the JSON response
            response_data = json.loads(response_text)
            
            # Extract the questions
            if "questions" in response_data:
                questions = response_data["questions"]
            else:
                # Sometimes the model returns an array directly
                questions = response_data
                
            # If the response is not already a list, make it one
            if not isinstance(questions, list):
                questions = [questions]
            
            # Process each question
            processed_questions = []
            for question in questions:
                # Ensure all required fields are present
                required_fields = ["questionJapanese", "questionEnglish", "options"]
                for field in required_fields:
                    if field not in question:
                        # Try alternative field names
                        alt_fields = {
                            "questionJapanese": ["question_japanese", "japanese_question", "question"],
                            "questionEnglish": ["question_english", "english_question", "translation"],
                            "options": ["choices", "answers", "answer_choices"]
                        }
                        
                        for alt in alt_fields.get(field, []):
                            if alt in question:
                                question[field] = question[alt]
                                break
                                
                # Standardize option format
                if "options" in question and isinstance(question["options"], list):
                    # Ensure options are properly formatted
                    formatted_options = []
                    for i, option in enumerate(question["options"]):
                        if isinstance(option, str):
                            formatted_options.append({
                                "text": option,
                                "id": chr(65 + i)  # A, B, C, D...
                            })
                        elif isinstance(option, dict) and "text" in option:
                            if "id" not in option:
                                option["id"] = chr(65 + i)
                            formatted_options.append(option)
                    question["options"] = formatted_options
                
                # Handle correct answer
                if "correctAnswer" not in question and "correct_answer" in question:
                    question["correctAnswer"] = question["correct_answer"]
                    
                # Remove answer information if not requested
                if not include_answers:
                    question.pop("correctAnswer", None)
                    question.pop("correct_answer", None)
                    question.pop("explanation", None)
                
                processed_questions.append(question)
                
            return processed_questions
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse JSON response: {str(e)}")
        except Exception as e:
            raise Exception(f"Error processing questions: {str(e)}")