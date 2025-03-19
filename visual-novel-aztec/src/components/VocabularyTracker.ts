import { VocabularyEntry } from '../types/StoryTypes';

interface VocabStats {
  exposures: number;
  lastSeen: number;
  mastered: boolean;
}

export class VocabularyTracker {
  // Change the value type from number to VocabStats
  private static vocabulary: Map<string, VocabStats> = new Map();
  
  static addWord(word: string, count: number = 1): void {
    const currentStats = this.vocabulary.get(word) || { exposures: 0, lastSeen: Date.now(), mastered: false };
    // Update the exposures count
    currentStats.exposures += count;
    // Update the last seen timestamp
    currentStats.lastSeen = Date.now();
    
    this.vocabulary.set(word, currentStats);
    this.save();
  }
  
  static getWords(): Map<string, VocabStats> {
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
