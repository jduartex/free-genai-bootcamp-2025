import Phaser from 'phaser';
import { SoundManager } from '../utils/SoundManager';

export class PreloadScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private audioUnlocked: boolean = false;

  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Create loading visuals
    this.createLoadingUI();
    
    // First create valid placeholder audio files before loading anything else
    this.createPlaceholderAudioFiles();
    
    // Track loading progress
    this.load.on('progress', (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0xffffff, 1);
      this.progressBar.fillRect(
        this.cameras.main.width / 4, 
        this.cameras.main.height / 2, 
        (this.cameras.main.width / 2) * value, 
        30
      );
      this.loadingText.setText(`Loading audio: ${Math.floor(value * 100)}%`);
    });
    
    // Preload essential audio files
    this.preloadAudioAssets();
  }

  create(): void {
    // Initialize SoundManager
    SoundManager.init(this);
    
    // Setup audio unlock mechanism
    this.setupAudioUnlock();
    
    // Check if we're on desktop or already unlocked
    if (!this.isMobileBrowser() || this.audioUnlocked) {
      this.continueToLoadScene();
    } else {
      this.showAudioUnlockPrompt();
    }
  }

  private createLoadingUI(): void {
    // Background
    this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000
    );
    
    // Title
    this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 3,
      'Aztec Escape',
      {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // Loading text
    this.loadingText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 50,
      'Loading audio: 0%',
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // Progress bar background
    this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width / 2,
      30,
      0x666666
    ).setOrigin(0.5);
    
    // Progress bar
    this.progressBar = this.add.graphics();
  }

  private preloadAudioAssets(): void {
    // Create UI audio directory if needed
    const uiAudioPath = 'assets/audio/ui';
    
    // Load essential UI sounds with more robust loading paths and fallback to base64 encoded silent audio
    this.load.audio('click', this.getSilentAudioBase64());
    this.load.audio('hover', this.getSilentAudioBase64());
    this.load.audio('success', this.getSilentAudioBase64());
    this.load.audio('fail', this.getSilentAudioBase64());
    this.load.audio('theme', this.getSilentAudioBase64());
    this.load.audio('unlock', this.getSilentAudioBase64());
    
    // Try loading actual files if they exist
    this.load.once('complete', () => {
      // Now try to load the actual files - if they fail, we already have placeholders
      this.load.audio('click', [`${uiAudioPath}/click.mp3`, `${uiAudioPath}/click.ogg`]);
      this.load.audio('hover', [`${uiAudioPath}/hover.mp3`, `${uiAudioPath}/hover.ogg`]);
      this.load.audio('success', [`${uiAudioPath}/success.mp3`, `${uiAudioPath}/success.ogg`]);
      this.load.audio('fail', [`${uiAudioPath}/fail.mp3`, `${uiAudioPath}/fail.ogg`]);
      
      // Load actual music and ambient sounds
      this.load.audio('theme', 'assets/audio/music/theme.mp3');
      this.load.audio('prison-ambience', 'assets/audio/ambience/prison.mp3');
      
      // Don't let errors stop the game
      this.load.on('loaderror', (fileObj: any) => {
        console.warn(`Failed to load audio "${fileObj.key}", using placeholder`);
      });
      
      // Start the second load operation
      this.load.start();
    });
  }
  
  private createPlaceholderAudioFiles(): void {
    // Create guaranteed valid placeholder audio files for essential sounds
    const requiredSounds = ['click', 'hover', 'success', 'fail', 'unlock', 'theme', 'prison-ambience'];
    
    requiredSounds.forEach(key => {
      // Add the audio directly to the cache
      this.cache.audio.add(key, this.createSilentAudioElement());
      console.log(`Created guaranteed placeholder for ${key}`);
    });
  }
  
  // Create a valid silent audio element that will decode successfully
  private createSilentAudioElement(): HTMLAudioElement {
    const audio = document.createElement('audio');
    // Use a base64 encoded silent MP3
    audio.src = this.getSilentAudioBase64();
    return audio;
  }
  
  // Return a base64 encoded silent MP3 (0.5 seconds)
  private getSilentAudioBase64(): string {
    // This is a valid 0.5 second silent MP3 file encoded as base64
    return "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADQgD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwAQAAAAAAAAAAABSAJAJAQgAAgAAAA0L2YLwxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
  }

  // Method to create an empty sound as fallback
  private createPlaceholderSound(key: string): void {
    try {
      // Create a silent sound using AudioContext
      if ('AudioContext' in window || 'webkitAudioContext' in window) {
        const audioContext = 'AudioContext' in window 
          ? new AudioContext() 
          : new (window as any).webkitAudioContext();
        
        // Create a short, silent buffer (0.1 seconds)
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, sampleRate * 0.1, sampleRate);
        
        // Fill with silence (zeros)
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = 0;
        }
        
        // Add to cache manually via a hack
        // This is a workaround - in a real production app, ensure actual sound files exist
        if (this.cache.audio && typeof this.cache.audio.add === 'function') {
          this.cache.audio.add(key, buffer);
          console.log(`Created empty sound placeholder for: ${key}`);
        }
      }
    } catch (e) {
      console.error(`Failed to create placeholder for ${key}:`, e);
    }
  }

  private setupAudioUnlock(): void {
    // Listen for audio unlock event
    this.sound.once('unlocked', () => {
      console.log('🔊 Audio unlocked automatically');
      this.audioUnlocked = true;
      
      // If we're showing the prompt, continue to next scene
      const unlockPrompt = document.getElementById('audio-unlock');
      if (unlockPrompt && unlockPrompt.style.display !== 'none') {
        this.continueToLoadScene();
      }
    });
    
    // Listen for custom unlock event from HTML element
    this.game.events.on('audioUnlocked', () => {
      console.log('🔊 Audio unlocked via button');
      this.audioUnlocked = true;
      this.continueToLoadScene();
    });
    
    // Try to play a silent sound to trigger unlock
    try {
      if (this.cache.audio.exists('unlock')) {
        const unlockSound = this.sound.add('unlock', { volume: 0.01 });
        unlockSound.play();
      }
    } catch (e) {
      console.warn('Failed to play unlock sound:', e);
    }
  }

  private isMobileBrowser(): boolean {
    // Basic check for mobile browsers
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private showAudioUnlockPrompt(): void {
    // Show the HTML unlock button
    const unlockPrompt = document.getElementById('audio-unlock');
    if (unlockPrompt) {
      unlockPrompt.style.display = 'block';
      
      // Add text to explain why this is needed
      this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height * 0.7,
        'Audio requires user interaction on mobile devices.\nPlease tap the "Enable Audio" button below.',
        {
          fontFamily: 'Arial',
          fontSize: '18px',
          color: '#ffffff',
          align: 'center'
        }
      ).setOrigin(0.5);
    } else {
      // If HTML element doesn't exist, create an in-game button
      const unlockButton = this.add.rectangle(
        this.cameras.main.width / 2,
        this.cameras.main.height * 0.7,
        300,
        60,
        0x4CAF50
      ).setInteractive({ useHandCursor: true });
      
      this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height * 0.7,
        'Enable Audio',
        {
          fontFamily: 'Arial',
          fontSize: '24px',
          color: '#ffffff'
        }
      ).setOrigin(0.5);
      
      unlockButton.on('pointerdown', () => {
        // Try to play a sound to unlock audio
        try {
          if (this.cache.audio.exists('unlock')) {
            const unlockSound = this.sound.add('unlock', { volume: 0.01 });
            unlockSound.play();
            this.time.delayedCall(100, () => {
              this.continueToLoadScene();
            });
          } else {
            this.continueToLoadScene();
          }
        } catch (e) {
          console.warn('Error during manual unlock:', e);
          this.continueToLoadScene();
        }
      });
    }
  }

  private continueToLoadScene(): void {
    const unlockPrompt = document.getElementById('audio-unlock');
    if (unlockPrompt) {
      unlockPrompt.style.display = 'none';
    }
    
    // Fade out and start LoadScene
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(500, () => {
      this.scene.start('LoadScene');
    });
  }
}
