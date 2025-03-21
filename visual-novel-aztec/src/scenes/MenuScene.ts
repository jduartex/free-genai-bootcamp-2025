import Phaser from 'phaser';
import { loadGameProgress } from '../utils/StoryLoader';

export class MenuScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;
  private startButton!: Phaser.GameObjects.Container; // Fixed type
  private continueButton!: Phaser.GameObjects.Container; // Fixed type
  private optionsButton!: Phaser.GameObjects.Container; // Fixed type
  private creditsButton!: Phaser.GameObjects.Container; // Fixed type
  private backgroundMusic!: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Add background image
    this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'aztec-village')
      .setOrigin(0.5)
      .setDisplaySize(this.cameras.main.width, this.cameras.main.height)
      .setAlpha(0.5);
    
    // Add overlay for better text contrast
    const overlay = this.add.rectangle(
      this.cameras.main.width / 2, 
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.7
    );

    // Create title text
    this.titleText = this.add.text(
      this.cameras.main.width / 2,
      100,
      'AZTEC ESCAPE',
      {
        fontFamily: 'Crimson Text',
        fontSize: '64px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5);

    // Subtitle
    this.add.text(
      this.cameras.main.width / 2,
      160,
      'A Japanese Language Learning Adventure',
      {
        fontFamily: 'Noto Sans JP',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }
    ).setOrigin(0.5);

    // Create buttons
    const buttonY = 260;
    const buttonSpacing = 80;
    const buttonStyle = {
      fontFamily: 'Noto Sans JP',
      fontSize: '28px',
      color: '#ffffff'
    };

    // New Game Button
    this.startButton = this.createButton(
      this.cameras.main.width / 2,
      buttonY,
      'Start New Game',
      buttonStyle,
      () => {
        this.startGame();
      }
    );

    // Check for saved game
    const savedGame = loadGameProgress();
    
    // Continue Button (only if save exists)
    if (savedGame) {
      this.continueButton = this.createButton(
        this.cameras.main.width / 2,
        buttonY + buttonSpacing,
        'Continue Game',
        buttonStyle,
        () => {
          this.continueGame();
        }
      );
    }

    // Options Button
    this.optionsButton = this.createButton(
      this.cameras.main.width / 2,
      buttonY + buttonSpacing * (savedGame ? 2 : 1),
      'Options',
      buttonStyle,
      () => {
        this.showOptions();
      }
    );

    // Credits Button
    this.creditsButton = this.createButton(
      this.cameras.main.width / 2,
      buttonY + buttonSpacing * (savedGame ? 3 : 2),
      'Credits',
      buttonStyle,
      () => {
        this.showCredits();
      }
    );

    // Add some animation to the title
    this.tweens.add({
      targets: this.titleText,
      y: 110,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Play background music - adding safety checks
    try {
      if (this.cache.audio.exists('theme')) {
        this.backgroundMusic = this.sound.add('theme', { loop: true, volume: 0.5 });
        if (this.backgroundMusic) {
          try {
            // The play method returns a boolean, not a Promise, so we can't use .catch()
            this.backgroundMusic.play();
          } catch (error: unknown) {
            console.warn('Error playing theme music:', error);
          }
        }
      } else {
        console.warn('Theme music not found in cache, using silent placeholder');
        // Create a silent background music object
        this.backgroundMusic = this.sound.add('click', { loop: true, volume: 0 });
      }
    } catch (error: unknown) {
      console.error('Failed to create background music:', error);
    }
  }

  private createButton(
    x: number, 
    y: number, 
    text: string, 
    style: Phaser.Types.GameObjects.Text.TextStyle, 
    callback: () => void
  ): Phaser.GameObjects.Container {
    // Create container for button elements
    const button = this.add.container(x, y);
    
    // Create background
    const bg = this.add.image(0, 0, 'button')
      .setDisplaySize(300, 60)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', callback)
      .on('pointerover', () => {
        bg.setTexture('button-hover');
        buttonText.setScale(1.1);
        
        // Play sound only if it exists and is properly loaded
        if (this.sound.get('click') && this.cache.audio.exists('click')) {
          try {
            this.sound.play('click', { volume: 0.5 });
          } catch (e) {
            console.warn('Could not play sound: click', e);
          }
        }
      })
      .on('pointerout', () => {
        bg.setTexture('button');
        buttonText.setScale(1.0);
      });
    
    // Create text
    const buttonText = this.add.text(0, 0, text, style)
      .setOrigin(0.5);
    
    // Add elements to container
    button.add([bg, buttonText]);
    
    return button;
  }

  private startGame(): void {
    // Stop background music safely
    if (this.backgroundMusic) {
      try {
        if (this.backgroundMusic.isPlaying) {
          this.backgroundMusic.stop();
        }
      } catch (e) {
        console.warn('Error stopping background music:', e);
      }
    }
    this.scene.start('GameScene', { sceneId: 'scene001', dialogId: 'x00' });
  }

  private continueGame(): void {
    const savedGame = loadGameProgress();
    if (savedGame) {
      // Stop background music safely
      if (this.backgroundMusic) {
        try {
          if (this.backgroundMusic.isPlaying) {
            this.backgroundMusic.stop();
          }
        } catch (e) {
          console.warn('Error stopping background music:', e);
        }
      }
      this.scene.start('GameScene', { 
        sceneId: savedGame.sceneId, 
        dialogId: savedGame.dialogId,
        remainingTime: savedGame.remainingTime 
      });
    }
  }

  private showOptions(): void {
    // Start the settings scene
    this.scene.start('SettingsScene', { returnScene: 'MenuScene' });
  }

  private showCredits(): void {
    // In a more complete implementation, this would show credits
    console.log('Credits');
  }
}
