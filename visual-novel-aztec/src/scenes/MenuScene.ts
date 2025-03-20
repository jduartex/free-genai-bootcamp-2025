import Phaser from 'phaser';
import { loadGameProgress } from '../utils/StoryLoader';

export class MenuScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;
  private startButton!: Phaser.GameObjects.Container;
  private continueButton!: Phaser.GameObjects.Container; 
  private optionsButton!: Phaser.GameObjects.Container;
  private creditsButton!: Phaser.GameObjects.Container;
  private backgroundMusic!: Phaser.Sound.BaseSound;
  private themeMusicKey: string = 'menu-theme';
  private assetsLoaded: boolean = false;

  constructor() {
    super({ key: 'MenuScene' });
  }

  preload(): void {
    console.log('MenuScene preload starting');
    
    // Preload critical UI assets first
    this.load.image('button', 'assets/ui/button-default.png');
    this.load.image('button-hover', 'assets/ui/button-hover.png');
    
    // Create a loading event to track when preload completes
    this.load.on('complete', this.handlePreloadComplete, this);
    
    console.log('MenuScene preload assets started');
  }

  private handlePreloadComplete(): void {
    console.log('MenuScene preload completed, assets now available');
    this.assetsLoaded = true;
    
    // Only try to play music if we're already in create (scene is active)
    if (this.scene.isActive()) {
      this.setupBackgroundMusic();
    }
  }

  create(): void {
    console.log('🎮 SIMPLE MENUSCENE CREATE STARTING');
    
    try {
      // Load theme music separately from other assets to avoid the race condition
      this.loadThemeMusic();
      
      // Add background image - using try-catch for robustness
      try {
        this.add.rectangle(
          this.cameras.main.width / 2,
          this.cameras.main.height / 2,
          this.cameras.main.width,
          this.cameras.main.height,
          0x223344
        );
      } catch (error) {
        console.warn('Failed to create background, fallback to solid color');
        this.add.rectangle(
          this.cameras.main.width / 2,
          this.cameras.main.height / 2,
          this.cameras.main.width,
          this.cameras.main.height,
          0x223344
        );
      }
      
      // Add overlay for better text contrast
      const overlay = this.add.rectangle(
        this.cameras.main.width / 2, 
        this.cameras.main.height / 2,
        this.cameras.main.width,
        this.cameras.main.height,
        0x000000,
        0.7
      );

      // Create title text - using system fonts for reliability
      this.titleText = this.add.text(
        this.cameras.main.width / 2,
        100,
        'AZTEC ESCAPE',
        {
          fontFamily: 'Georgia, Times, serif',
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
          fontFamily: 'Arial, Helvetica, sans-serif',
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
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '28px',
        color: '#ffffff'
      };

      // Simple rectangle buttons that don't depend on textures
      const createSimpleButton = (x: number, y: number, text: string, callback: () => void) => {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 300, 60, 0x4a6c6f, 0.8)
          .setStrokeStyle(2, 0xffffff)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', callback)
          .on('pointerover', () => { 
            bg.setFillStyle(0x5d8a8f);
            buttonText.setScale(1.1);
          })
          .on('pointerout', () => {
            bg.setFillStyle(0x4a6c6f);
            buttonText.setScale(1.0);
          });
        
        const buttonText = this.add.text(0, 0, text, buttonStyle).setOrigin(0.5);
        container.add([bg, buttonText]);
        return container;
      };

      // New Game Button
      this.startButton = createSimpleButton(
        this.cameras.main.width / 2,
        buttonY,
        'Start New Game',
        () => { this.startGame(); }
      );

      // Check for saved game
      const savedGame = loadGameProgress();
      
      // Continue Button (only if save exists)
      if (savedGame) {
        this.continueButton = createSimpleButton(
          this.cameras.main.width / 2,
          buttonY + buttonSpacing,
          'Continue Game',
          () => { this.continueGame(); }
        );
      }

      // Options Button
      this.optionsButton = createSimpleButton(
        this.cameras.main.width / 2,
        buttonY + buttonSpacing * (savedGame ? 2 : 1),
        'Options',
        () => { this.showOptions(); }
      );

      // Credits Button
      this.creditsButton = createSimpleButton(
        this.cameras.main.width / 2,
        buttonY + buttonSpacing * (savedGame ? 3 : 2),
        'Credits',
        () => { this.showCredits(); }
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

      // If preload has completed, set up background music
      if (this.assetsLoaded) {
        this.setupBackgroundMusic();
      }
      
      // Notify that MenuScene is ready
      if (window.notifyMenuSceneReady) {
        console.log('Notifying that MenuScene is ready');
        window.notifyMenuSceneReady();
      }
      
      console.log('🎮 MENU BUTTONS SHOULD NOW BE VISIBLE');
    } catch (error) {
      console.error('Fatal error in MenuScene create:', error);
      
      // Emergency fallback UI if everything else fails
      this.add.text(
        this.cameras.main.width / 2, 
        this.cameras.main.height / 2,
        'ERROR LOADING MENU\nClick anywhere to start game',
        {
          fontFamily: 'Arial',
          fontSize: '32px',
          color: '#ffffff',
          align: 'center'
        }
      )
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.start('GameScene', { sceneId: 'scene001', dialogId: 'x00' });
      });
    }
  }

  private loadThemeMusic(): void {
    console.log('Loading theme music');
    
    // Use a different key to avoid conflicts
    this.load.audio(this.themeMusicKey, 'assets/audio/theme.mp3');
    
    // Set up a one-time event handler for when this particular file loads
    this.load.once('filecomplete-audio-' + this.themeMusicKey, () => {
      console.log(`Theme music '${this.themeMusicKey}' loaded successfully`);
      this.setupBackgroundMusic();
    });
    
    // Handle errors specifically for theme music
    this.load.once('loaderror', (file: any) => {
      if (file.key === this.themeMusicKey) {
        console.warn('Failed to load theme music, trying alternative');
        // Try alternative version
        this.load.audio('alt-theme', 'assets/audio/alt-theme.mp3');
        this.themeMusicKey = 'alt-theme';
        this.load.start();
      }
    });
    
    // Start loading just this specific asset
    this.load.start();
  }

  private setupBackgroundMusic(): void {
    try {
      // Only proceed if the audio is actually in the cache
      if (this.cache.audio.exists(this.themeMusicKey)) {
        console.log(`Creating sound from cache key: ${this.themeMusicKey}`);
        
        // Actually create the sound
        this.backgroundMusic = this.sound.add(this.themeMusicKey, { 
          loop: true, 
          volume: 0.5 
        });
        
        // Play it with error handling
        try {
          this.backgroundMusic.play();
          console.log('Background music started successfully');
        } catch (error) {
          console.warn('Error playing background music:', error);
        }
      } else {
        console.warn(`Theme music '${this.themeMusicKey}' not found in cache`);
      }
    } catch (error) {
      console.error('Error setting up background music:', error);
    }
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
