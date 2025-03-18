import Phaser from 'phaser';
import { SoundManager } from '../utils/SoundManager';

// Add proper WebKit audio context declaration
interface AudioContextConstructor {
  new (): AudioContext;
}

interface WebKitAudioContextConstructor {
  new (): AudioContext;
}

// Declare WebKit prefixed AudioContext on window
declare global {
  interface Window {
    webkitAudioContext?: WebKitAudioContextConstructor;
  }
}

// Define SliderData interface
interface SliderData {
  track: Phaser.GameObjects.Rectangle;
  knob: Phaser.GameObjects.Image;
  value: number;
  key: string;
  label: Phaser.GameObjects.Text;
}

interface SliderConfig {
  x: number;
  y: number;
  width: number;
  height?: number;
  key?: string;
  initialValue: number;
  onChange: (value: number) => void;
  label: string;
  labelColor?: string;
}

export class SettingsScene extends Phaser.Scene {
  // Class fields properly declared with their types
  private _returnScene: string;
  private _sliders: Record<string, Phaser.GameObjects.Container>;
  private _lastDragSound: number;
  private _soundManager: SoundManager | null;

  constructor() {
    super({ key: 'SettingsScene' });
    
    // Initialize properties in constructor
    this._returnScene = 'MenuScene';
    this._sliders = {};
    this._lastDragSound = 0;
    this._soundManager = null;
  }

  init(data: { returnScene?: string } = {}): void {
    this._returnScene = data.returnScene || 'MenuScene';
  }

  create(): void {
    // Initialize SoundManager
    this._soundManager = (SoundManager as any).getInstance();
    
    // Background
    const bg = this.add.rectangle(
      this.cameras.main.width / 2, 
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.85
    );

    // Title
    const title = this.add.text(
      this.cameras.main.width / 2,
      50,
      'Settings',
      {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // Create slider controls
    this.createSliderControls();
    
    // Create back button
    this.createBackButton();
    
    // Create audio test button
    this.createAudioTestButton();
  }

  private createButton(key: string): Phaser.GameObjects.Image {
    const button = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height - 50,
      'button-default'
    )
    .setDisplaySize(200, 60)
    .setInteractive({ useHandCursor: true });
    
    return button;
  }

  private createSlider(label: string, initialValue: number, key: string, yOffset: number): Phaser.GameObjects.Container {
    const x = this.cameras.main.width / 2;
    const y = 150 + yOffset;
    
    // Create a container for all slider elements
    const container = this.add.container(0, 0);
    
    // Create label
    const labelText = this.add.text(
      x - 200,
      y,
      label,
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setOrigin(0, 0.5);
    
    // Create slider track
    const track = this.add.rectangle(
      x,
      y,
      300,
      8,
      0x666666
    ).setOrigin(0.5);
    
    // Create slider knob
    const knob = this.add.image(
      x - 150 + (initialValue * 300),
      y,
      'button-default' // Use a small image for the knob
    )
    .setDisplaySize(20, 20)
    .setInteractive({ useHandCursor: true });
    
    // Make knob draggable
    this.input.setDraggable(knob);
    
    // Add all elements to the container
    container.add([track, knob, labelText]);
    
    // Store slider data in the container for later access
    const sliderData: SliderData = {
      track,
      knob,
      value: initialValue,
      key,
      label: labelText
    };
    
    // Attach the data to the container
    container.setData('sliderData', sliderData);
    
    // Store the container in the sliders dictionary
    this._sliders[key] = container;
    
    return container;
  }

  private setupDragEvents(): void {
    // Set up drag events
    this.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image, dragX: number) => {
      // Find which slider this belongs to
      for (const key in this._sliders) {
        const container = this._sliders[key];
        const sliderData = container.getData('sliderData') as SliderData;
        
        if (sliderData.knob === gameObject) {
          // Constrain position to track
          const minX = sliderData.track.x - (sliderData.track.width / 2);
          const maxX = sliderData.track.x + (sliderData.track.width / 2);
          
          let x = Math.max(minX, Math.min(maxX, dragX));
          
          // Update knob position
          sliderData.knob.x = x;
          
          // Calculate and store slider value (0-1)
          sliderData.value = (x - minX) / sliderData.track.width;
          
          // Play drag sound occasionally for feedback but not too often
          const now = Date.now();
          if (now - this._lastDragSound > 100) { // Only every 100ms
            this.sound.play('click', { volume: 0.1 });
            this._lastDragSound = now;
          }
          
          // Update value in sound manager
          this.updateSoundManagerValue(key, sliderData.value);
        }
      }
    });
    
    this.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image) => {
      // Find which slider this belongs to
      for (const key in this._sliders) {
        const container = this._sliders[key];
        const sliderData = container.getData('sliderData') as SliderData;
        
        if (sliderData.knob === gameObject) {
          // Play feedback sound when setting is finalized
          this.sound.play('click', { volume: 0.2 });
        }
      }
    });
  }

  private updateSoundManagerValue(key: string, value: number): void {
    if (!this._soundManager) {
      // Try to get the sound manager instance
      this._soundManager = SoundManager.getInstance();
    }
    
    if (!this._soundManager) return;
    
    // Update the correct volume based on the slider key
    switch(key) {
      case 'master':
        this._soundManager.setMasterVolume(value);
        break;
      case 'music':
        this._soundManager.setMusicVolume(value);
        break;
      case 'effects':
        this._soundManager.setEffectVolume(value);
        break;
      case 'voices':
        this._soundManager.setVoiceVolume(value);
        break;
    }
  }

  private createSliderControls(): void {
    // Create volume sliders
    this.createSlider('Master Volume', this.getSavedVolume('master'), 'master', 0);
    this.createSlider('Music Volume', this.getSavedVolume('music'), 'music', 60);
    this.createSlider('Effects Volume', this.getSavedVolume('effects'), 'effects', 120);
    this.createSlider('Voice Volume', this.getSavedVolume('voices'), 'voices', 180);
    
    // Set up drag events
    this.setupDragEvents();
    
    // Create test sound button
    this.createTestSoundButton();
  }

  private createBackButton(): void {
    // Create back button
    const backButton = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height - 80,
      'button-default'
    )
    .setDisplaySize(200, 60)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      this.sound.play('click', { volume: 0.5 });
      this.scene.start(this._returnScene);
    });
    
    // Add text to the button
    const backText = this.add.text(
      backButton.x,
      backButton.y,
      'Back',
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
  }

  private createAudioTestButton(): void {
    // Create test audio button
    const testButton = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height - 160,
      'button-default'
    )
    .setDisplaySize(200, 60)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      this.sound.play('click', { volume: 0.5 });
      this.tryUnlockAudio();
    });
    
    // Add text to the button
    const testText = this.add.text(
      testButton.x,
      testButton.y,
      'Test Audio',
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
  }

  private createTestSoundButton(): void {
    // Create a button to test sound effects
    const testSoundButton = this.add.image(
      this.cameras.main.width - 100,
      150,
      'button-default'
    )
    .setDisplaySize(120, 40)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      // Play test sounds to verify volumes
      // Get the slider values from the container's data
      const masterSliderData = this._sliders['master'].getData('sliderData') as SliderData;
      const effectsSliderData = this._sliders['effects'].getData('sliderData') as SliderData;
      
      this.sound.play('click', { 
        volume: effectsSliderData.value * masterSliderData.value 
      });
    });
    
    // Add text to the button
    const testText = this.add.text(
      testSoundButton.x,
      testSoundButton.y,
      'Test',
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
  }

  private tryUnlockAudio(): void {
    try {
      // Check if AudioContext exists in the window object
      if (typeof window === 'undefined') {
        console.warn('Window object not available, cannot unlock audio');
        return;
      }

      // Simplify to avoid TypeScript errors with webkitAudioContext
      const audioContextConstructor = 
        (window.AudioContext || 
         (window as any).webkitAudioContext) as typeof AudioContext | undefined;
      
      if (!audioContextConstructor) {
        console.warn('AudioContext not supported in this browser');
        return;
      }
      
      try {
        const audioContext = new audioContextConstructor();
        // Create a short, silent buffer
        const buffer = audioContext.createBuffer(1, 1, 22050);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        
        // Play the sound (this is the important part for unlocking)
        if (source.start) {
          source.start(0);
        } else {
          // Handle older browsers that may use noteOn instead of start
          (source as any).noteOn(0);
        }
        
        // Also try to play a sound from Phaser's sound manager
        if (this.sound && this.sound.play) {
          this.sound.play('click', { volume: 0.1 });
        }
        
        console.log('Audio unlock attempted');
      } catch (e) {
        console.warn('Error creating audio context:', e);
      }
    } catch (e) {
      console.warn('Error unlocking audio:', e);
    }
  }

  private getSavedVolume(key: string): number {
    // Try to get saved volume from localStorage
    try {
      const savedVolume = localStorage.getItem(`aztecEscape_volume_${key}`);
      if (savedVolume !== null) {
        return parseFloat(savedVolume);
      }
    } catch (e) {
      console.warn('Error reading saved volume:', e);
    }
    
    // Default volumes if nothing is saved
    const defaults: Record<string, number> = {
      master: 1.0,
      music: 0.7,
      effects: 0.8,
      voices: 1.0
    };
    
    return defaults[key] || 0.5;
  }

  private saveVolume(volume: number, key: string): void {
    try {
      localStorage.setItem(`aztecEscape_volume_${key}`, volume.toString());
    } catch (e) {
      console.warn('Error saving volume:', e);
    }
  }
  
  update(): void {
    // Update the volume display if needed
    // Save volumes to localStorage
    for (const key in this._sliders) {
      const sliderData = this._sliders[key].getData('sliderData') as SliderData;
      this.saveVolume(sliderData.value, key);
    }
  }
}
