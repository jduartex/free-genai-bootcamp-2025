import { VocabularyEntry } from '../types/StoryTypes';

interface VocabStats {
  exposures: number;
  lastSeen: number;
  mastered: boolean;
}

export class VocabularyTracker {
  private static vocabulary: Map<string, number> = new Map();
  
  static addWord(word: string, count: number = 1): void {
    const currentCount = this.vocabulary.get(word) || 0;
    this.vocabulary.set(word, currentCount + count);
    this.save();
  }
  
  static getWords(): Map<string, number> {
    return new Map(this.vocabulary);
  }
  
  static hasWord(word: string): boolean {
    return this.vocabulary.has(word);
  }
  
  static clear(): void {
    this.vocabulary.clear();
    this.save();
  }
  
  static save(): void {
    localStorage.setItem('aztecEscape_vocabulary', 
      JSON.stringify(Array.from(this.vocabulary.entries())));
  }
  
  static load(): void {
    const saved = localStorage.getItem('aztecEscape_vocabulary');
    if (saved) {
      try {
        this.vocabulary = new Map(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load vocabulary data:', e);
      }
    }
  }
}
