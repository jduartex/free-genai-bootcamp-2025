import Phaser from 'phaser';

export class SoundManager {
  private static instance: SoundManager;
  private scene: Phaser.Scene;
  private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();
  private enabled: boolean = true;
  private audioUnlocked: boolean = false;

  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    // Check if audio context is already unlocked - with proper type checking
    this.audioUnlocked = this.isAudioContextRunning();
    
    // Handle scene events
    this.scene.events.on('shutdown', this.shutdown, this);
    
    // Listen for audio unlock events
    this.scene.sound.once('unlocked', () => {
      console.log('Audio unlocked!');
      this.audioUnlocked = true;
      
      // Replay any sounds that were attempted before unlocking
      this.sounds.forEach((sound, key) => {
        if (!sound.isPlaying && sound.markers && sound.markers.pending) {
          console.log(`Replaying sound that was pending unlock: ${key}`);
          sound.play('pending');
          delete sound.markers.pending;
        }
      });
    });
  }

  // Helper method to safely check audio context state
  private isAudioContextRunning(): boolean {
    const soundManager = this.scene.sound;
    
    // Check if using WebAudio (the only one with a context)
    if ('context' in soundManager) {
      const webAudioManager = soundManager as Phaser.Sound.WebAudioSoundManager;
      return webAudioManager.context.state === 'running';
    }
    
    // For other sound managers, assume unlocked
    return true;
  }

  static init(scene: Phaser.Scene): void {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager(scene);
    }
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      throw new Error('SoundManager not initialized. Call init() first.');
    }
    return SoundManager.instance;
  }

  loadAudio(key: string, path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.scene.cache.audio.exists(key)) {
        console.log(`Audio ${key} already loaded`);
        resolve();
        return;
      }
      
      console.log(`Loading audio: ${key} from ${path}`);
      
      this.scene.load.audio(key, path);
      this.scene.load.once(`filecomplete-audio-${key}`, () => {
        console.log(`Audio loaded successfully: ${key}`);
        resolve();
      });
      this.scene.load.once('loaderror', (fileObj: any) => {
        if (fileObj.key === key) {
          console.error(`Failed to load audio: ${key}`);
          reject(new Error(`Failed to load audio: ${key}`));
        }
      });
      this.scene.load.start();
    });
  }

  playSound(key: string, options: Phaser.Types.Sound.SoundConfig = {}): void {
    if (!this.enabled) return;
    
    try {
      if (!this.scene.cache.audio.exists(key)) {
        console.warn(`Sound ${key} not found in cache`);
        return;
      }
      
      // Get or create the sound
      let sound = this.sounds.get(key);
      if (!sound) {
        sound = this.scene.sound.add(key, { volume: 0.7, ...options });
        this.sounds.set(key, sound);
      }
      
      if (!this.audioUnlocked) {
        console.log(`Audio not unlocked, adding pending marker for ${key}`);
        // Add a marker so we can replay this sound once audio is unlocked
        sound.addMarker({
          name: 'pending',
          start: 0,
          duration: sound.totalDuration
        });
      }
      
      // Play the sound
      if (this.audioUnlocked) {
        console.log(`Playing sound: ${key}`);
        sound.play(options);
      } else {
        console.log(`Attempting to unlock audio with sound: ${key}`);
        // This play attempt might unlock the audio
        sound.play(options);
      }
    } catch (error) {
      console.error(`Error playing sound ${key}:`, error);
    }
  }

  stopSound(key: string): void {
    const sound = this.sounds.get(key);
    if (sound && sound.isPlaying) {
      sound.stop();
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    // Fix: Use the setMute method instead of modifying volume property
    this.sounds.forEach(sound => {
      // Cast to any since the BaseSound type doesn't directly expose these methods
      (sound as any).setMute(!enabled);
    });
  }

  private shutdown(): void {
    this.sounds.forEach(sound => {
      if (sound.isPlaying) {
        sound.stop();
      }
    });
    this.sounds.clear();
  }
}
