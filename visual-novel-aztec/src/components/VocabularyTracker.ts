import { VocabularyEntry } from '../types/StoryTypes';

interface VocabStats {
  exposures: number;
  lastSeen: number;
  mastered: boolean;
}

export class VocabularyTracker {
  private static vocabulary: Map<string, VocabularyEntry & VocabStats> = new Map();
  
  static addVocabulary(entry: VocabularyEntry): void {
    const wordId = entry.word;
    
    if (this.vocabulary.has(wordId)) {
      // Update existing entry
      const existing = this.vocabulary.get(wordId)!;
      existing.exposures += 1;
      existing.lastSeen = Date.now();
    } else {
      // Add new entry
      this.vocabulary.set(wordId, {
        ...entry,
        exposures: 1,
        lastSeen: Date.now(),
        mastered: false
      });
    }
    
    this.save();
  }
  
  static markAsMastered(wordId: string): void {
    if (this.vocabulary.has(wordId)) {
      const entry = this.vocabulary.get(wordId)!;
      entry.mastered = true;
      this.save();
    }
  }
  
  static getSpacedRepetitionWords(count: number = 5): VocabularyEntry[] {
    // Get words due for review based on spaced repetition algorithm
    const now = Date.now();
    const allWords = Array.from(this.vocabulary.values());
    
    // Sort by a priority function that considers time since last seen and exposures
    const sortedWords = allWords
      .filter(word => !word.mastered)
      .sort((a, b) => {
        const timeFactorA = (now - a.lastSeen) / (a.exposures * 86400000); // days in ms
        const timeFactorB = (now - b.lastSeen) / (b.exposures * 86400000);
        return timeFactorB - timeFactorA; // Higher score = higher priority
      });
      
    return sortedWords.slice(0, count);
  }
  
  static getKnownVocabulary(): VocabularyEntry[] {
    return Array.from(this.vocabulary.values())
      .filter(word => word.mastered)
      .map(({ exposures, lastSeen, mastered, ...rest }) => rest);
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
