import Phaser from 'phaser';
import { DialogEntry, DialogChoice, StoryData } from '../types/StoryTypes';
import { getCharacterName } from '../utils/StoryLoader';

export class DialogueScene extends Phaser.Scene {
  private dialogBox!: Phaser.GameObjects.Image;
  private characterNameText!: Phaser.GameObjects.Text;
  private dialogText!: Phaser.GameObjects.Text;
  private englishText!: Phaser.GameObjects.Text;
  private characterPortrait!: Phaser.GameObjects.Sprite | Phaser.GameObjects.Spine;
  private continueIndicator!: Phaser.GameObjects.Text;
  private choiceButtons: Phaser.GameObjects.Container[] = [];
  private currentEntry!: DialogEntry;
  private currentStoryData!: StoryData;
  private typingSpeed: number = 30; // ms per character
  private isTyping: boolean = false;
  private showEnglish: boolean = true;
  private dialogSound!: Phaser.Sound.BaseSound;
  private useSpineAnimations: boolean = false;
  
  constructor() {
    super({ key: 'DialogueScene' });
  }

  init(data: { dialogId: string; storyData: StoryData }): void {
    this.currentStoryData = data.storyData;
    this.currentEntry = this.currentStoryData.dialog[data.dialogId];
    
    // Check if we have spine animations
    this.useSpineAnimations = this.textures.exists('tlaloc-spine') && 
                             this.textures.exists('citlali-spine');
                             
    // Check if English subtitles should be shown (could be stored in localStorage)
    this.showEnglish = localStorage.getItem('aztecEscape_showEnglish') !== 'false';
  }

  create(): void {
    // Create dialog box background
    this.dialogBox = this.add.image(
      this.cameras.main.width / 2, 
      this.cameras.main.height - 150,
      'dialog-box'
    ).setOrigin(0.5, 0.5)
    .setDisplaySize(this.cameras.main.width - 40, 200);
    
    // Create character name
    const speakerName = getCharacterName(this.currentEntry.speakerId);
    this.characterNameText = this.add.text(
      30, 
      this.cameras.main.height - 240,
      speakerName, 
      { 
        fontFamily: 'Crimson Text',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        backgroundColor: '#422'
      }
    ).setPadding(10, 5, 10, 5);
    
    // Create Japanese text
    this.dialogText = this.add.text(
      30, 
      this.cameras.main.height - 190, 
      '', 
      { 
        fontFamily: 'Noto Sans JP',
        fontSize: '22px',
        color: '#ffffff',
        wordWrap: { width: this.cameras.main.width - 80 }
      }
    );
    
    // Create English translation (only visible if showEnglish is true)
    this.englishText = this.add.text(
      30, 
      this.cameras.main.height - 120, 
      '', 
      { 
        fontFamily: 'Crimson Text',
        fontSize: '18px',
        color: '#cccccc',
        wordWrap: { width: this.cameras.main.width - 80 },
        fontStyle: 'italic'
      }
    ).setVisible(this.showEnglish);
    
    // Create toggle for English text
    const toggleText = this.add.text(
      this.cameras.main.width - 140, 
      this.cameras.main.height - 240, 
      `English: ${this.showEnglish ? 'ON' : 'OFF'}`, 
      { 
        fontFamily: 'Crimson Text',
        fontSize: '18px',
        color: '#cccccc',
        backgroundColor: '#422'
      }
    ).setPadding(10, 5, 10, 5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      this.showEnglish = !this.showEnglish;
      this.englishText.setVisible(this.showEnglish);
      toggleText.setText(`English: ${this.showEnglish ? 'ON' : 'OFF'}`);
      localStorage.setItem('aztecEscape_showEnglish', this.showEnglish.toString());
    });
    
    // Create continue indicator
    this.continueIndicator = this.add.text(
      this.cameras.main.width - 50, 
      this.cameras.main.height - 60, 
      '▼', 
      { 
        fontFamily: 'Crimson Text',
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setVisible(false)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.advanceDialog());
    
    // Add click event on dialog box for advancing dialog
    this.dialogBox.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.isTyping) {
          // If still typing, show all text immediately
          this.completeTyping();
        } else {
          // If typing is done, advance dialog
          this.advanceDialog();
        }
      });
    
    // Create character portrait based on speaker
    this.createCharacterPortrait();
    
    // Start dialog typing effect
    this.typeWriterEffect(this.currentEntry.japanese);
    
    // Add vocabulary display if applicable
    if (this.currentEntry.words && this.currentEntry.words.length > 0) {
      this.setupVocabularyHighlighting();
    }
    
    // If entry has choices, create choice buttons when typing finishes
    if (this.currentEntry.choices && this.currentEntry.choices.length > 0) {
      this.events.once('typingComplete', this.createChoiceButtons, this);
    } else {
      this.events.once('typingComplete', () => {
        this.continueIndicator.setVisible(true);
        this.continueIndicator.setAlpha(0);
        this.tweens.add({
          targets: this.continueIndicator,
          alpha: 1,
          duration: 500,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1
        });
      });
    }
    
    // Setup vocabulary tooltip system
    this.setupVocabularyTooltips();
  }

  private createCharacterPortrait(): void {
    // Remove existing portrait if any
    if (this.characterPortrait) {
      this.characterPortrait.destroy();
    }

    // Don't show portrait for narrator
    if (this.currentEntry.speakerId === 'narrator') {
      return;
    }
    
    // Create character portrait
    const x = this.cameras.main.width * 0.15;
    const y = this.cameras.main.height * 0.4;
    
    if (this.useSpineAnimations && 
        (this.currentEntry.speakerId === 'tlaloc' || 
         this.currentEntry.speakerId === 'citlali')) {
      
      // Use spine animation if available
      const spineKey = `${this.currentEntry.speakerId}-spine`;
      
      this.characterPortrait = this.add.spine(
        x, y, spineKey, 'idle', true
      ) as Phaser.GameObjects.Spine;
      
      // Play talking animation
      if (this.characterPortrait.findAnimation('talk')) {
        this.characterPortrait.play('talk', true);
        
        // Switch back to idle when dialog finishes
        this.events.once('typingComplete', () => {
          if (this.characterPortrait && this.characterPortrait.findAnimation('idle')) {
            (this.characterPortrait as Phaser.GameObjects.Spine).play('idle', true);
          }
        });
      }
      
    } else {
      // Fall back to static image
      this.characterPortrait = this.add.sprite(
        x, y, this.currentEntry.speakerId
      ).setOrigin(0.5, 0.5)
      .setDisplaySize(300, 400);
      
      // Add a simple animation to make the static image less static
      this.tweens.add({
        targets: this.characterPortrait,
        y: y - 5,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  private typeWriterEffect(text: string): void {
    this.isTyping = true;
    let i = 0;
    const speed = this.typingSpeed;
    const timer = this.time.addEvent({
      delay: speed,
      callback: () => {
        this.dialogText.setText(this.dialogText.text + text[i]);
        i++;
        
        // Play typing sound occasionally (not for every character)
        if (i % 3 === 0) {
          this.sound.play('click', { volume: 0.1 });
        }
        
        if (i === text.length) {
          timer.destroy();
          this.isTyping = false;
          
          // Show English translation after Japanese text is complete
          if (this.showEnglish) {
            this.englishText.setText(this.currentEntry.english);
          }
          
          this.events.emit('typingComplete');
        }
      },
      callbackScope: this,
      loop: true
    });
  }

  private completeTyping(): void {
    // Stop all typing timers
    this.time.removeAllEvents();
    
    // Show full text
    this.dialogText.setText(this.currentEntry.japanese);
    
    // Show English translation
    if (this.showEnglish) {
      this.englishText.setText(this.currentEntry.english);
    }
    
    this.isTyping = false;
    this.events.emit('typingComplete');
  }

  private advanceDialog(): void {
    // Don't advance if still typing
    if (this.isTyping) return;
    
    // Don't advance if choices are showing
    if (this.choiceButtons.length > 0) return;
    
    // Get the next dialog ID
    const nextDialogId = this.currentEntry.default_next_id;
    if (!nextDialogId) {
      console.error('No next dialog ID specified');
      return;
    }

    // Clean up this scene
    this.scene.stop();
    
    // Emit event to tell GameScene to move to next dialog
    this.scene.get('GameScene').events.emit('dialogueComplete', nextDialogId);
  }

  private createChoiceButtons(): void {
    if (!this.currentEntry.choices) return;
    
    const choices = this.currentEntry.choices;
    const buttonHeight = 60;
    const buttonSpacing = 20;
    const totalHeight = choices.length * buttonHeight + (choices.length - 1) * buttonSpacing;
    let startY = (this.cameras.main.height - totalHeight) / 2;
    
    choices.forEach((choice, index) => {
      const y = startY + index * (buttonHeight + buttonSpacing);
      
      const choiceContainer = this.add.container(this.cameras.main.width / 2, y);
      
      // Create button background
      const buttonBg = this.add.rectangle(
        0, 0, this.cameras.main.width - 200, buttonHeight, 0x333333, 0.8
      ).setStrokeStyle(2, 0xffffff, 1);
      
      // Create Japanese text
      const japaneseText = this.add.text(
        0, -10, choice.japanese, 
        { 
          fontFamily: 'Noto Sans JP',
          fontSize: '20px',
          color: '#ffffff',
          align: 'center'
        }
      ).setOrigin(0.5, 0.5);
      
      // Create English text if needed
      let englishText;
      if (this.showEnglish) {
        englishText = this.add.text(
          0, 15, choice.english, 
          { 
            fontFamily: 'Crimson Text',
            fontSize: '16px',
            color: '#cccccc',
            fontStyle: 'italic',
            align: 'center'
          }
        ).setOrigin(0.5, 0.5);
      }
      
      // Add all elements to container
      if (englishText) {
        choiceContainer.add([buttonBg, japaneseText, englishText]);
      } else {
        choiceContainer.add([buttonBg, japaneseText]);
      }
      
      // Make container interactive
      buttonBg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          buttonBg.fillColor = 0x666666;
          this.sound.play('hover', { volume: 0.3 });
        })
        .on('pointerout', () => {
          buttonBg.fillColor = 0x333333;
        })
        .on('pointerdown', () => this.handleChoice(choice));
      
      this.choiceButtons.push(choiceContainer);
    });
    
    // Hide continue indicator when choices are shown
    if (this.continueIndicator) {
      this.continueIndicator.setVisible(false);
    }
  }

  private handleChoice(choice: DialogChoice): void {
    // Play selection sound
    this.sound.play('click', { volume: 0.5 });
    
    // Clean up choices
    this.choiceButtons.forEach(button => button.destroy());
    this.choiceButtons = [];
    
    // Check if this is a puzzle answer
    if (choice.puzzle_answer !== undefined) {
      const currentDialogId = this.currentEntry.default_next_id?.split('-')[0] || '';
      const puzzleId = currentDialogId.includes('puzzle') ? currentDialogId : 'unknown';
      
      // Emit event with answer for GameScene to process
      this.scene.get('GameScene').events.emit(
        'puzzleSolved', 
        puzzleId, 
        choice.puzzle_answer
      );
    }
    
    // Clean up this scene
    this.scene.stop();
    
    // Emit event to tell GameScene to move to next dialog
    this.scene.get('GameScene').events.emit('dialogueComplete', choice.next_id);
  }

  private setupVocabularyHighlighting(): void {
    // Implement word highlighting based on timing data
    // This would highlight words in the Japanese text as they are spoken
    // For now, this is a placeholder for future implementation
  }

  private setupVocabularyTooltips(): void {
    // Get vocabulary words for this scene
    const vocabulary = this.currentStoryData.vocabulary;
    if (!vocabulary || vocabulary.length === 0) return;
    
    // Create interactive areas for each word in the dialog
    // This would allow clicking on words to see translations
    // For now, this is a placeholder for future implementation
  }
}
