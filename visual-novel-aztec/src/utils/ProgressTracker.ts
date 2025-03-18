interface Progress {
  scenesCompleted: string[];
  puzzlesSolved: string[];
  vocabularyLearned: string[];
  timeRemaining: number;
  hintsUsed: number;
  wrongAnswers: number;
}

export class ProgressTracker {
  private static progress: Progress = {
    scenesCompleted: [],
    puzzlesSolved: [],
    vocabularyLearned: [],
    timeRemaining: 0,
    hintsUsed: 0,
    wrongAnswers: 0
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
  
  static checkAchievements(): void {
    // Implementation
  }
  
  static getProgress(): Progress {
    return this.progress;
  }
}
