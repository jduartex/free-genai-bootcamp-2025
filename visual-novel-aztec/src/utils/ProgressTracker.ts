export interface GameProgress {
  // General progress
  scenesCompleted: string[];
  puzzlesSolved: string[];
  
  // Language learning stats
  vocabularyLearned: string[];
  grammarPointsSeen: string[];
  
  // Game stats
  timeRemaining: number;
  hintsUsed: number;
  wrongAnswers: number;
  
  // Trophies/achievements
  achievements: string[];
}

export class ProgressTracker {
  private static progress: GameProgress = {
    scenesCompleted: [],
    puzzlesSolved: [],
    vocabularyLearned: [],
    grammarPointsSeen: [],
    timeRemaining: 0,
    hintsUsed: 0,
    wrongAnswers: 0,
    achievements: []
  };
  
  static initialize(): void {
    // Load from localStorage if available
    const savedProgress = localStorage.getItem('aztecEscape_progress');
    if (savedProgress) {
      try {
        this.progress = JSON.parse(savedProgress);
      } catch (e) {
        console.error('Failed to load progress:', e);
      }
    }
  }
  
  static save(): void {
    localStorage.setItem('aztecEscape_progress', JSON.stringify(this.progress));
  }
  
  static addCompletedScene(sceneId: string): void {
    if (!this.progress.scenesCompleted.includes(sceneId)) {
      this.progress.scenesCompleted.push(sceneId);
      this.checkAchievements();
      this.save();
    }
  }
  
  static addSolvedPuzzle(puzzleId: string): void {
    if (!this.progress.puzzlesSolved.includes(puzzleId)) {
      this.progress.puzzlesSolved.push(puzzleId);
      this.checkAchievements();
      this.save();
    }
  }
  
  static addLearnedVocabulary(wordId: string): void {
    if (!this.progress.vocabularyLearned.includes(wordId)) {
      this.progress.vocabularyLearned.push(wordId);
      this.checkAchievements();
      this.save();
    }
  }
  
  static updateTimeRemaining(time: number): void {
    this.progress.timeRemaining = time;
    this.save();
  }
  
  static incrementHintsUsed(): void {
    this.progress.hintsUsed++;
    this.save();
  }
  
  static incrementWrongAnswers(): void {
    this.progress.wrongAnswers++;
    this.save();
  }
  
  private static checkAchievements(): void {
    // Check for various milestones and add achievements
    if (this.progress.puzzlesSolved.length >= 3 && 
        !this.progress.achievements.includes('puzzle_master')) {
      this.progress.achievements.push('puzzle_master');
    }
    
    if (this.progress.vocabularyLearned.length >= 10 &&
        !this.progress.achievements.includes('language_learner')) {
      this.progress.achievements.push('language_learner');  
    }
  }
  
  static getProgress(): GameProgress {
    return this.progress;
  }
}
