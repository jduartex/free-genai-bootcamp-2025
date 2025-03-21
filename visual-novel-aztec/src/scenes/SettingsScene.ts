import Phaser from 'phaser';
import { SoundManager } from '../utils/SoundManager';

export class SettingsScene extends Phaser.Scene {
  private soundManager!: SoundManager;
  private sliders: { 
    [key: string]: { 
      bar: Phaser.GameObjects.Rectangle; 
      handle: Phaser.GameObjects.Rectangle;
      value: number;
      valueText: Phaser.GameObjects.Text;
    } 
  } = {};
  private returnScene: string = 'MenuScene';
  
  constructor() {
    super({ key: 'SettingsScene' });
  }
  
  init(data: { returnScene?: string } = {}): void {
    if (data.returnScene) {
      this.returnScene = data.returnScene;
    }
  }
  
  create(): void {
    this.soundManager = SoundManager.getInstance();
    
    // Preload necessary UI sounds to prevent "not found in cache" errors
    this.preloadUIAudioIfNeeded();
    
    // Create dark overlay
    this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.8
    );
    
    // Create panel with increased height to fit all controls
    const panel = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      600,
      550, // Increased height
      0x333333,
      0.95
    ).setStrokeStyle(2, 0xffffff);
    
    // Create title
    this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 220,
      'Audio Settings',
      {
        fontFamily: 'Crimson Text',
        fontSize: '32px',
        color: '#ffffff',
        align: 'center'
      }
    ).setOrigin(0.5);
    
    // Get current volume settings
    const volumes = this.soundManager.getVolumeSettings();
    
    // Further reduced indentation for all sliders and labels
    const leftOffset = 10; // Reduced from 30 to keep everything inside the box
    
    // Create volume sliders with reduced indentation
    this.createVolumeSlider('Master Volume', volumes.master, 'master', -120, leftOffset);
    this.createVolumeSlider('Music Volume', volumes.music, 'music', -40, leftOffset);
    this.createVolumeSlider('Effects Volume', volumes.effects, 'effects', 40, leftOffset);
    this.createVolumeSlider('Voice Volume', volumes.voice, 'voice', 120, leftOffset);
    
    // Create test sound button - positioned further down to fit in panel
    this.createTestSoundButton();
    
    // Create back button - positioned further down to fit in panel
    this.createBackButton();
  }
  
  // Add this helper method to ensure UI sounds are available
  private preloadUIAudioIfNeeded(): void {
    // Check if UI sounds exist in cache, load them if not
    const requiredSounds = ['click', 'hover', 'success', 'fail', 'test-sound'];
    
    requiredSounds.forEach(soundKey => {
      if (!this.cache.audio.exists(soundKey)) {
        console.log(`Sound "${soundKey}" not in cache, loading it now...`);
        this.load.audio(soundKey, `assets/audio/ui/${soundKey}.mp3`);
      }
    });
    
    // Only start loading if any sounds were added to the loader
    if (this.load.list.size > 0) {
      this.load.once('complete', () => {
        console.log('UI sounds loaded successfully');
      });
      this.load.start();
    }
  }
  
  // Add a helper method to safely play sounds
  private playSoundSafe(key: string, volume: number = 0.5): void {
    try {
      // First check if the sound exists in cache
      if (this.cache.audio.exists(key)) {
        this.sound.play(key, { volume });
      } else {
        console.warn(`Sound "${key}" not available in SettingsScene`);
      }
    } catch (e) {
      console.warn(`Error playing sound "${key}":`, e);
    }
  }

  private createVolumeSlider(
    label: string,
    initialValue: number,
    key: string,
    yOffset: number,
    leftOffset: number = 200 // Default to original value if not specified
  ): void {
    // Create label with reduced left offset
    this.add.text(
      this.cameras.main.width / 2 - 230 + leftOffset, // Moved further left (-230 instead of -200)
      this.cameras.main.height / 2 + yOffset,
      label,
      {
        fontFamily: 'Crimson Text',
        fontSize: '20px',
        color: '#ffffff'
      }
    ).setOrigin(0, 0.5);
    
    // Create slider bar background with adjusted width and position
    const barWidth = 250 - leftOffset; // Reduced width to fit in panel
    const barHeight = 10;
    
    const bar = this.add.rectangle(
      this.cameras.main.width / 2 + 20, // Moved left from 50 to 20
      this.cameras.main.height / 2 + yOffset,
      barWidth,
      barHeight,
      0x666666
    ).setOrigin(0, 0.5);
    
    // Create slider handle
    const handleWidth = 20;
    const handleHeight = 30;
    
    const handle = this.add.rectangle(
      bar.x + barWidth * initialValue,
      bar.y,
      handleWidth,
      handleHeight,
      0x4CAF50
    ).setOrigin(0.5, 0.5)
    .setInteractive({ draggable: true, useHandCursor: true });
    
    // Move value text closer to slider
    const valueText = this.add.text(
      bar.x + barWidth + 5, // Reduced offset from 10 to 5
      bar.y,
      `${Math.round(initialValue * 100)}%`,
      {
        fontFamily: 'Crimson Text',
        fontSize: '18px',
        color: '#ffffff'
      }
    ).setOrigin(0, 0.5);
    
    // Store slider references
    this.sliders[key] = {
      bar,
      handle,
      value: initialValue,
      valueText
    };
    
    // Set up drag events
    handle.on('drag', (pointer: Phaser.Input.Pointer) => {
      // Calculate new position within bounds
      let newX = Phaser.Math.Clamp(
        pointer.x,
        bar.x,
        bar.x + barWidth
      );
      
      // Update handle position
      handle.x = newX;
      
      // Calculate value (0 to 1)
      const value = (newX - bar.x) / barWidth;
      this.sliders[key].value = value;
      
      // Update display text
      valueText.setText(`${Math.round(value * 100)}%`);
      
      // Update sound manager in real-time
      this.updateVolume(key, value);
      
      // Add haptic feedback with sound - use safe playback method
      if (!this.lastDragSound || this.time.now > this.lastDragSound + 100) {
        this.playSoundSafe('click', 0.1);
        this.lastDragSound = this.time.now;
      }
    });
    
    // Make bar clickable too for better UX
    bar.setInteractive({ useHandCursor: true })
      .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        // Calculate value based on click position
        const value = Phaser.Math.Clamp(
          (pointer.x - bar.x) / barWidth,
          0,
          1
        );
        
        // Update handle position
        handle.x = bar.x + (barWidth * value);
        this.sliders[key].value = value;
        
        // Update display text
        valueText.setText(`${Math.round(value * 100)}%`);
        
        // Update sound manager
        this.updateVolume(key, value);
        
        // Play click sound - use safe playback method
        this.playSoundSafe('click', 0.2);
      });
  }

  private lastDragSound: number = 0;
  
  private updateVolume(key: string, value: number): void {
    // Apply the volume change to the sound manager
    switch (key) {
      case 'master':
        this.soundManager.setMasterVolume(value);
        break;
      case 'music':
        this.soundManager.setMusicVolume(value);
        break;
      case 'effects':
        this.soundManager.setEffectsVolume(value);
        break;
      case 'voice':
        this.soundManager.setVoiceVolume(value);
        break;
    }
  }
  
  private createTestSoundButton(): void {
    // Create test sound button - positioned higher in the panel
    const testButton = this.add.rectangle(
      this.cameras.main.width / 2 - 110,
      this.cameras.main.height / 2 + 200, // Positioned higher in the panel
      200,
      50,
      0x555555
    ).setStrokeStyle(2, 0xffffff)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      testButton.fillColor = 0x777777;
    })
    .on('pointerout', () => {
      testButton.fillColor = 0x555555;
    })
    .on('pointerdown', () => {
      this.testAudio(); // Call the proper test audio function
    });
    
    this.add.text(
      this.cameras.main.width / 2 - 110,
      this.cameras.main.height / 2 + 200,
      'Test Audio',
      {
        fontFamily: 'Crimson Text',
        fontSize: '20px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
  }
  
  // Fix audio testing functionality - avoid using Phaser's sound system entirely
  private testAudio(): void {
    try {
      console.log("Test audio button clicked");
      // Get master volume
      const masterVolume = this.sliders['master'] ? this.sliders['master'].value : 0.5;
      
      // Only use the Web Audio API approach which is more reliable
      this.createSimpleTestTone(masterVolume);
      
      // Create a visual feedback that audio is playing
      const feedbackText = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2 - 50,
        "Playing test tone...",
        { 
          fontFamily: 'Crimson Text', 
          fontSize: '20px', 
          color: '#ffffff',
          backgroundColor: '#333333'
        }
      ).setPadding(10, 5, 10, 5).setOrigin(0.5);
      
      // Remove the feedback after the tone finishes
      this.time.delayedCall(1000, () => {
        feedbackText.destroy();
      });
    } catch (error) {
      console.error('Error in testAudio:', error);
    }
  }

  // Improved test tone with multiple frequencies and better error handling
  private createSimpleTestTone(volume: number = 0.5): void {
    try {
      console.log("Creating test tone with volume:", volume);
      
      // Only attempt this in browsers that support the Web Audio API
      if (window.AudioContext || (window as any).webkitAudioContext) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        
        // Create multiple oscillators for a richer sound
        const frequencies = [440, 554, 659]; // A4, C#5, E5 (A major chord)
        
        frequencies.forEach((frequency, index) => {
          // Create oscillator (tone generator)
          const oscillator = audioContext.createOscillator();
          oscillator.type = index === 0 ? 'sine' : 'triangle';
          oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
          
          // Create gain node (volume control)
          const gainNode = audioContext.createGain();
          const adjustedVolume = volume * (index === 0 ? 0.2 : 0.1); // Main tone louder
          
          // Add fade-in and fade-out
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(adjustedVolume, audioContext.currentTime + 0.1);
          gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.8);
          
          // Connect and play
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.start();
          console.log(`Test tone ${index+1} started`);
          
          // Stop after playing
          setTimeout(() => {
            try {
              oscillator.stop();
              console.log(`Test tone ${index+1} stopped`);
            } catch (stopError) {
              // Ignore errors on stop
            }
          }, 800); // 800ms tone
        });
        
        return; // Successfully created Web Audio API tones
      }
      
      // Fallback for browsers without Web Audio API support
      this.playFallbackTone(volume);
      
    } catch (e) {
      console.error('Failed to create test tone:', e);
      this.playFallbackTone(volume);
    }
  }

  // Last resort fallback using the HTML5 Audio API
  private playFallbackTone(volume: number): void {
    try {
      console.log("Attempting to play fallback tone");
      // Use a data URI with a very short audio sample
      const audio = new Audio();
      // This is a base64 encoded short beep sound
      audio.src = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tUwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAGAAADAABgYGBgYGBgYGBgYGBgYGCMjIyMjIyMjIyMjIyMjIy0tLS0tLS0tLS0tLS0tLTd3d3d3d3d3d3d3d3d3d3///////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAYAAAAAAAAAAwDVxttG//sUZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==";
      audio.volume = volume;
      
      // Create a promise to handle both success and error
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => console.log("Fallback tone played successfully"))
          .catch(err => {
            console.error("Fallback audio failed to play:", err);
            // If even this fails, just show a message
            this.add.text(
              this.cameras.main.width / 2,
              this.cameras.main.height / 2 - 20,
              "Your browser blocked audio.\nPlease check your settings.",
              { 
                fontFamily: 'Arial', 
                fontSize: '16px', 
                color: '#ffffff',
                align: 'center'
              }
            ).setOrigin(0.5).setAlpha(0.9);
          });
      }
    } catch (audioError) {
      console.error("All audio approaches failed:", audioError);
    }
  }
  
  private createBackButton(): void {
    // Create back button - positioned higher in the panel
    const backButton = this.add.rectangle(
      this.cameras.main.width / 2 + 110,
      this.cameras.main.height / 2 + 200, // Positioned higher in the panel
      200,
      50,
      0x993333
    ).setStrokeStyle(2, 0xffffff)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      backButton.fillColor = 0xbb3333;
    })
    .on('pointerout', () => {
      backButton.fillColor = 0x993333;
    })
    .on('pointerdown', () => {
      this.playSoundSafe('click', 0.5);
      this.returnToMenu();
    });
    
    this.add.text(
      this.cameras.main.width / 2 + 110,
      this.cameras.main.height / 2 + 200,
      'Back',
      {
        fontFamily: 'Crimson Text',
        fontSize: '20px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
  }
  
  private returnToMenu(): void {
    this.scene.start(this.returnScene);
  }
}
