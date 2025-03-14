import Phaser from 'phaser';
import { loadGameProgress } from '../utils/StoryLoader';

export class MenuScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;
  private startButton!: Phaser.GameObjects.Image;
  private continueButton!: Phaser.GameObjects.Image;
  private optionsButton!: Phaser.GameObjects.Image;
  private creditsButton!: Phaser.GameObjects.Image;
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

    // Play background music
    this.backgroundMusic = this.sound.add('theme', { loop: true, volume: 0.5 });
    this.backgroundMusic.play();
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
        this.sound.play('click', { volume: 0.5 });
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
    this.backgroundMusic.stop();
    this.scene.start('GameScene', { sceneId: 'scene001', dialogId: 'x00' });
  }

  private continueGame(): void {
    const savedGame = loadGameProgress();
    if (savedGame) {
      this.backgroundMusic.stop();
      this.scene.start('GameScene', { 
        sceneId: savedGame.sceneId, 
        dialogId: savedGame.dialogId,
        remainingTime: savedGame.remainingTime 
      });
    }
  }

  private showOptions(): void {
    // In a more complete implementation, this would open an options menu
    console.log('Options menu');
  }

  private showCredits(): void {
    // In a more complete implementation, this would show credits
    console.log('Credits');
  }
}
