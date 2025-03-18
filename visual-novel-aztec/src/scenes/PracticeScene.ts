import Phaser from 'phaser';
import { VocabularyTracker } from '../utils/VocabularyTracker.js';

// Define VocabularyEntry interface
interface VocabularyEntry {
  word: string;
  translation: string;
  example: string;
  mastered: boolean;
  lastReviewed?: number;
}

export class PracticeScene extends Phaser.Scene {
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private wordText!: Phaser.GameObjects.Text;
  private currentWord!: VocabularyEntry;
  private words: VocabularyEntry[] = [];
  private choices: Phaser.GameObjects.Container[] = [];
  
  constructor() {
    super({ key: 'PracticeScene' });
  }
  
  create(): void {
    // Set up background
    this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x222266
    );
    
    // Title
    this.add.text(
      this.cameras.main.width / 2,
      50,
      'Practice Mode: Japanese Vocabulary',
      {
        fontFamily: 'Crimson Text',
        fontSize: '36px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // Score display
    this.scoreText = this.add.text(
      this.cameras.main.width - 50,
      50,
      'Score: 0',
      {
        fontFamily: 'Crimson Text',
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setOrigin(1, 0.5);
    
    // Get vocabulary to practice
    this.words = VocabularyTracker.getSpacedRepetitionWords(10);
    
    if (this.words.length === 0) {
      // No words to practice, show message
      this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        'No vocabulary to practice yet.\nPlay the story mode to learn words!',
        {
          fontFamily: 'Crimson Text',
          fontSize: '32px',
          color: '#ffffff',
          align: 'center'
        }
      ).setOrigin(0.5);
      
      // Add return button
      this.createReturnButton();
      
      return;
    }
    
    // Create word display area
    this.wordText = this.add.text(
      this.cameras.main.width / 2,
      200,
      '',
      {
        fontFamily: 'Noto Sans JP',
        fontSize: '48px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // Show first question
    this.showNextWord();
    
    // Add return button
    this.createReturnButton();
  }
  
  showNextWord(): void {
    // Clear previous choices
    this.choices.forEach(choice => choice.destroy());
    this.choices = [];
    
    if (this.words.length === 0) {
      // Done with all words
      this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        `Practice complete!\nFinal score: ${this.score}`,
        {
          fontFamily: 'Crimson Text',
          fontSize: '36px',
          color: '#ffffff',
          align: 'center'
        }
      ).setOrigin(0.5);
      return;
    }
    
    // Get current word and remove from array
    this.currentWord = this.words.shift()!;
    
    // Display the Japanese word
    this.wordText.setText(this.currentWord.word);
    
    // Create answer choices
    this.createChoices();
  }
  
  createChoices(): void {
    // Get all vocabulary for wrong answers
    const allVocab = VocabularyTracker.getKnownVocabulary();
    
    // Create array with correct answer and 3 wrong ones
    const correctAnswer = this.currentWord.translation;
    
    // Filter out the correct answer and pick 3 random wrong answers
    const wrongAnswers = allVocab
      .filter((word: VocabularyEntry) => word.translation !== correctAnswer)
      .map((word: VocabularyEntry) => word.translation)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    // Combine and shuffle
    const allChoices = [correctAnswer, ...wrongAnswers]
      .sort(() => Math.random() - 0.5);
    
    // Create buttons
    const buttonY = 350;
    const buttonSpacing = 80;
    
    allChoices.forEach((choice, index) => {
      const y = buttonY + index * buttonSpacing;
      
      const choiceButton = this.add.container(this.cameras.main.width / 2, y);
      
      // Button background
      const bg = this.add.rectangle(
        0, 0, 400, 60, 0x333333
      ).setStrokeStyle(2, 0xffffff);
      
      // Button text
      const text = this.add.text(
        0, 0, choice,
        {
          fontFamily: 'Crimson Text',
          fontSize: '24px',
          color: '#ffffff'
        }
      ).setOrigin(0.5);
      
      // Make interactive
      bg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          bg.fillColor = 0x555555;
        })
        .on('pointerout', () => {
          bg.fillColor = 0x333333;
        })
        .on('pointerdown', () => {
          this.checkAnswer(choiceButton);
        });
      
      choiceButton.add([bg, text]);
      this.choices.push(choiceButton);
    });
  }
  
  checkAnswer(choice: Phaser.GameObjects.Container): void {
    const correctAnswer = this.currentWord.translation;
    
    if (choice.getAll().some(item => item instanceof Phaser.GameObjects.Text && item.text === correctAnswer)) {
      // Correct answer
      this.score += 10;
      this.scoreText.setText(`Score: ${this.score}`);
      
      // Mark as mastered if answered correctly multiple times
      if (Math.random() > 0.7) { // 30% chance to mark as mastered
        VocabularyTracker.markAsMastered(this.currentWord.word);
      } else {
        // Just update stats
        VocabularyTracker.addVocabulary(this.currentWord);
      }
      
      // Show feedback
      this.showFeedback(true, correctAnswer);
    } else {
      // Incorrect answer
      this.score = Math.max(0, this.score - 5);
      this.scoreText.setText(`Score: ${this.score}`);
      
      // Update stats
      VocabularyTracker.addVocabulary(this.currentWord);
      
      // Show feedback
      this.showFeedback(false, correctAnswer);
    }
  }
  
  showFeedback(correct: boolean, correctAnswer: string): void {
    // Disable choice buttons
    this.choices.forEach(choice => {
      choice.getAll().forEach(item => {
        if (item instanceof Phaser.GameObjects.Rectangle) {
          item.disableInteractive();
        }
      });
    });
    
    // Show feedback text
    const feedbackText = this.add.text(
      this.cameras.main.width / 2,
      280,
      correct ? 'Correct!' : `Incorrect. The answer is: ${correctAnswer}`,
      {
        fontFamily: 'Crimson Text',
        fontSize: '28px',
        color: correct ? '#00ff00' : '#ff0000'
      }
    ).setOrigin(0.5);
    
    // Show example
    this.add.text(
      this.cameras.main.width / 2,
      320,
      this.currentWord.example,
      {
        fontFamily: 'Noto Sans JP',
        fontSize: '18px',
        color: '#cccccc',
        align: 'center'
      }
    ).setOrigin(0.5);
    
    // Next question after delay
    this.time.delayedCall(2000, () => {
      feedbackText.destroy();
      this.showNextWord();
    });
  }
  
  createReturnButton(): void {
    const returnButton = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height - 50,
      200,
      50,
      0x333333
    ).setStrokeStyle(2, 0xffffff)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      returnButton.fillColor = 0x555555;
    })
    .on('pointerout', () => {
      returnButton.fillColor = 0x333333;
    })
    .on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
    
    this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height - 50,
      'Return to Menu',
      {
        fontFamily: 'Crimson Text',
        fontSize: '18px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
  }
}
