import axios from 'axios';
import { DialogEntry } from '../types/StoryTypes.js';

interface OllamaResponse {
  response: string;
  model: string;
  created_at: string;
}

export class DialogueGenerator {
  private static readonly API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434/api';
  private static readonly MODEL = process.env.OLLAMA_MODEL || 'llama3:8b';
  
  /**
   * Generate dialogue entries for a character
   */
  static async generateCharacterDialogue(
    character: string,
    situation: string,
    count: number = 3
  ): Promise<DialogEntry[]> {
    try {
      const prompt = `
        Generate ${count} lines of dialogue for an Aztec character named ${character} in the following situation:
        "${situation}"
        
        For each line, provide:
        1. Japanese text (in proper Japanese, not romanized)
        2. English translation
        3. A default next dialogue ID (use format "nnn" where n is a digit)
        
        Format the output as JSON in this structure:
        [
          {
            "speakerId": "${character}",
            "japanese": "(Japanese text)",
            "english": "(English translation)",
            "default_next_id": "(ID)"
          }
        ]
      `;
      
      const response = await axios.post<OllamaResponse>(`${this.API_URL}/generate`, {
        model: this.MODEL,
        prompt: prompt,
        stream: false
      });
      
      // Parse the JSON response
      const text = response.data.response;
      // Extract the JSON part
      const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      
      if (!jsonMatch) {
        throw new Error('Could not extract valid JSON from the response');
      }
      
      const dialogues = JSON.parse(jsonMatch[0]) as DialogEntry[];
      return dialogues;
    } catch (error) {
      console.error('Failed to generate dialogue:', error);
      throw error;
    }
  }
  
  /**
   * Generate puzzle content for the game
   */
  static async generatePuzzle(
    theme: string,
    difficultyLevel: number
  ): Promise<{
    question: string;
    questionEnglish: string;
    options: Array<{japanese: string; english: string; isCorrect: boolean}>;
  }> {
    try {
      const prompt = `
        Generate a Japanese language puzzle about "${theme}" with difficulty level ${difficultyLevel} (1-5).
        The puzzle should test vocabulary or grammar appropriate for JLPT N5 (beginner) level.
        
        Include:
        1. A question in Japanese
        2. English translation of the question
        3. Three possible answers in Japanese with English translations
        4. Mark which answer is correct
        
        Format the output as JSON in this structure:
        {
          "question": "(Japanese question)",
          "questionEnglish": "(English translation)",
          "options": [
            {"japanese": "(option 1)", "english": "(translation)", "isCorrect": true/false},
            {"japanese": "(option 2)", "english": "(translation)", "isCorrect": true/false},
            {"japanese": "(option 3)", "english": "(translation)", "isCorrect": true/false}
          ]
        }
      `;
      
      const response = await axios.post<OllamaResponse>(`${this.API_URL}/generate`, {
        model: this.MODEL,
        prompt: prompt,
        stream: false
      });
      
      // Parse the JSON response
      const text = response.data.response;
      // Extract the JSON part
      const jsonMatch = text.match(/\{\s*"question[\s\S]*\}\s*\]/);
      
      if (!jsonMatch) {
        throw new Error('Could not extract valid JSON from the response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to generate puzzle:', error);
      throw error;
    }
  }
}
