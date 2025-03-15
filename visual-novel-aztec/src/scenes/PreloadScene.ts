import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Create loading bar
    this.createLoadingBar();
    
    // Load fonts via WebFontLoader (handled in index.ts)
    
    // Load UI elements
    this.load.image('button', 'assets/ui/default_button.png');
    this.load.image('button-hover', 'assets/ui/default_button.png'); // Use same for now
    this.load.image('dialog-box', 'assets/ui/default_dialog.png');
    
    // Load background images
    this.load.image('aztec-village', 'assets/backgrounds/village.png');
    this.load.image('prison-cell', 'assets/backgrounds/prison.png');
    this.load.image('temple', 'assets/backgrounds/temple.png');
    this.load.image('default-background', 'assets/backgrounds/default.png');
    
    // Load character images
    this.load.image('tlaloc', 'assets/characters/tlaloc.png');
    this.load.image('citlali', 'assets/characters/citlali.png');
    this.load.image('diego', 'assets/characters/diego.png');
    this.load.image('narrator', 'assets/characters/narrator.png');
    
    // Load interactive objects
    this.load.image('window', 'assets/objects/window.png');
    this.load.image('floor-pattern', 'assets/objects/floor-pattern.png');
    this.load.image('bed', 'assets/objects/bed.png');
    this.load.image('door', 'assets/objects/door.png');
    this.load.image('return-arrow', 'assets/objects/return-arrow.png');
    this.load.image('exit', 'assets/objects/exit.png');

    // Load audio with error handling and fallbacks
    this.loadAudioWithFallbacks('click', 'assets/audio/ui/click.mp3');
    this.loadAudioWithFallbacks('hover', 'assets/audio/ui/hover.mp3');
    this.loadAudioWithFallbacks('success', 'assets/audio/ui/success.mp3');
    this.loadAudioWithFallbacks('fail', 'assets/audio/ui/fail.mp3');
    this.loadAudioWithFallbacks('unlock', 'assets/audio/ui/unlock.mp3');
    this.loadAudioWithFallbacks('theme', 'assets/audio/ui/theme.mp3');
    this.loadAudioWithFallbacks('prison-ambience', 'assets/audio/ambience/prison-ambience.mp3');
    this.loadAudioWithFallbacks('village-ambience', 'assets/audio/ambience/village-ambience.mp3');
    this.loadAudioWithFallbacks('battle-ambience', 'assets/audio/ambience/battle-ambience.mp3');
    this.loadAudioWithFallbacks('tunnel-ambience', 'assets/audio/ambience/tunnel-ambience.mp3');
    this.loadAudioWithFallbacks('warning', 'assets/audio/ui/warning.mp3');
    this.loadAudioWithFallbacks('pickup', 'assets/audio/ui/pickup.mp3');
  }

  create(): void {
    // Audio unlock for mobile browsers
    this.setupAudioUnlock();
    
    // Wait a short moment to ensure everything is ready
    this.time.delayedCall(500, () => {
      // Transition to menu scene
      this.scene.start('MenuScene');
    });
  }

  private createLoadingBar(): void {
    const { width, height } = this.cameras.main;
    
    // Create loading bar background
    const barWidth = width * 0.8;
    const barHeight = 30;
    const barX = (width - barWidth) / 2;
    const barY = height / 2;
    
    this.loadingBar = this.add.graphics();
    this.loadingBar.setDepth(1);
    
    // Add loading text
    this.loadingText = this.add.text(
      width / 2,
      barY - 40,
      'Loading Assets...',
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // Update loading bar as assets load
    this.load.on('progress', (value: number) => {
      // Draw background
      this.loadingBar.clear();
      this.loadingBar.fillStyle(0x333333, 1);
      this.loadingBar.fillRect(barX, barY, barWidth, barHeight);
      
      // Draw progress bar
      this.loadingBar.fillStyle(0x00ff00, 1);
      this.loadingBar.fillRect(barX, barY, barWidth * value, barHeight);
    });
    
    // Clean up when loading is complete
    this.load.on('complete', () => {
      this.loadingBar.destroy();
      this.loadingText.destroy();
    });
  }
  
  // Better audio loading with fallbacks and silent placeholder
  private loadAudioWithFallbacks(key: string, path: string): void {
    // First try to load the actual sound
    this.load.audio(key, path);
    
    // Create a guaranteed placeholder on file error
    this.load.once('fileerror-audio-' + key, () => {
      console.log(`Creating guaranteed placeholder for ${key}`);
      this.createSilentAudioPlaceholder(key);
    });
  }
  
  // Create a proper silent audio file
  private createSilentAudioPlaceholder(key: string): void {
    try {
      // Create a proper AudioBuffer with actual audio data (1 frame of silence)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const silenceBuffer = audioContext.createBuffer(2, 44100, 44100);
      
      // Export the buffer to a Blob
      const offlineContext = new OfflineAudioContext(2, 44100, 44100);
      const source = offlineContext.createBufferSource();
      source.buffer = silenceBuffer;
      source.connect(offlineContext.destination);
      source.start(0);
      
      offlineContext.startRendering().then(renderedBuffer => {
        // Convert AudioBuffer to WAV format
        const wav = this.audioBufferToWav(renderedBuffer);
        const blob = new Blob([wav], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        
        // Load this into Phaser's cache
        this.load.audio(key, url);
        this.load.start(); // Important: start the loader to process the new file
      }).catch(e => {
        console.error(`Failed to render audio buffer for ${key}:`, e);
      });
    } catch (error) {
      console.error(`Error creating placeholder audio for ${key}:`, error);
    }
  }
  
  // Convert AudioBuffer to WAV format for better browser compatibility
  private audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    // Get the data from each channel
    const channelData = [];
    for (let i = 0; i < numChannels; i++) {
      channelData.push(buffer.getChannelData(i));
    }
    
    // Calculate the total file size
    const dataSize = buffer.length * numChannels * bytesPerSample;
    const fileSize = 44 + dataSize;
    
    // Create a buffer for the WAV file
    const wav = new ArrayBuffer(fileSize);
    const view = new DataView(wav);
    
    // Write WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, fileSize - 8, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Write audio data
    const offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let c = 0; c < numChannels; c++) {
        const sample = Math.max(-1, Math.min(1, channelData[c][i]));
        const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset + (i * blockAlign) + (c * bytesPerSample), int16, true);
      }
    }
    
    return wav;
  }
  
  // Helper to write string to DataView
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  
  // Set up audio unlock for browsers that require user interaction
  private setupAudioUnlock(): void {
    const unlockAudio = () => {
      try {
        // Try to play a sound to unlock audio
        if (this.cache.audio.exists('unlock')) {
          this.sound.play('unlock', { volume: 0 });
          console.log('🔊 Audio unlocked by user interaction');
        }
      } catch (e) {
        console.error('Failed to unlock audio:', e);
      }
      
      // Remove the event listeners
      document.body.removeEventListener('touchstart', unlockAudio);
      document.body.removeEventListener('touchend', unlockAudio);
      document.body.removeEventListener('click', unlockAudio);
      document.body.removeEventListener('keydown', unlockAudio);
    };
    
    // Try to automatically unlock audio
    try {
      const sound = this.sound.add('click', { volume: 0 });
      sound.play();
      sound.stop();
      console.log('🔊 Audio unlocked automatically');
    } catch (e) {
      console.warn('Could not unlock audio automatically', e);
      
      // Add event listeners for user interaction
      document.body.addEventListener('touchstart', unlockAudio, false);
      document.body.addEventListener('touchend', unlockAudio, false);
      document.body.addEventListener('click', unlockAudio, false);
      document.body.addEventListener('keydown', unlockAudio, false);
    }
  }
}
