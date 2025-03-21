import Phaser from 'phaser';

interface VolumeSettings {
  master: number;
  music: number;
  effects: number;
  voice: number;
}

export class SoundManager {
  private static instance: SoundManager;
  private scene: Phaser.Scene;
  private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();
  private enabled: boolean = true;
  private audioUnlocked: boolean = false;
  
  // Volume settings with default values
  private volumes: VolumeSettings = {
    master: 0.8,
    music: 0.7,
    effects: 0.8,
    voice: 1.0
  };
  
  // Track sound categories
  private musicSounds: Set<string> = new Set();
  private effectSounds: Set<string> = new Set();
  private voiceSounds: Set<string> = new Set();

  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    // Load volume settings from localStorage if available
    this.loadVolumeSettings();
    
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
        console.warn(`Sound "${key}" not found in cache, using fallback`);
        // Use a known good sound as fallback
        key = 'click';
        if (!this.scene.cache.audio.exists(key)) {
          return; // If even the fallback doesn't exist, give up
        }
      }
      
      // Get or create the sound
      let sound = this.sounds.get(key);
      if (!sound) {
        try {
          // Apply proper category volume
          let categoryVolume = this.volumes.effects; // default category
          
          if (this.musicSounds.has(key)) {
            categoryVolume = this.volumes.music;
          } else if (this.voiceSounds.has(key)) {
            categoryVolume = this.volumes.voice;
          } else if (this.effectSounds.has(key)) {
            categoryVolume = this.volumes.effects;
          }
          
          // Apply master volume multiplier
          const finalVolume = Math.min(1, Math.max(0, categoryVolume * this.volumes.master));
          
          // Create sound with proper volume
          sound = this.scene.sound.add(key, { 
            volume: finalVolume,
            ...options 
          });
          
          this.sounds.set(key, sound);
        } catch (error) {
          console.error(`Error creating sound "${key}":`, error);
          return;
        }
      }
      
      try {
        if (!this.audioUnlocked) {
          console.log(`Audio not unlocked, adding pending marker for ${key}`);
          // Add a marker so we can replay this sound once audio is unlocked
          sound.addMarker({
            name: 'pending',
            start: 0,
            duration: sound.totalDuration || 0.5
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
      } catch (playError) {
        console.error(`Error playing sound "${key}":`, playError);
      }
    } catch (error) {
      console.error(`Error in playSound for "${key}":`, error);
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
    // Use type assertion to access volume property
    this.sounds.forEach(sound => {
      (sound as any).volume = enabled ? this.getVolumeForSound(sound.key) : 0;
    });
  }
  
  // Register a sound to a category for volume management
  registerSound(key: string, category: 'music' | 'effects' | 'voice'): void {
    if (category === 'music') {
      this.musicSounds.add(key);
    } else if (category === 'effects') {
      this.effectSounds.add(key);
    } else if (category === 'voice') {
      this.voiceSounds.add(key);
    }
    
    // Update volume for existing sound with type assertion
    const sound = this.sounds.get(key);
    if (sound) {
      (sound as any).volume = this.getVolumeForSound(key);
    }
  }
  
  // Get the appropriate volume for a sound based on its category
  private getVolumeForSound(key: string): number {
    let categoryVolume = this.volumes.effects; // default
    
    if (this.musicSounds.has(key)) {
      categoryVolume = this.volumes.music;
    } else if (this.voiceSounds.has(key)) {
      categoryVolume = this.volumes.voice;
    }
    
    // Apply master volume
    return Math.min(1, Math.max(0, categoryVolume * this.volumes.master));
  }
  
  // Volume control methods
  setMasterVolume(volume: number): void {
    volume = Math.min(1, Math.max(0, volume));
    this.volumes.master = volume;
    
    // Update all sound volumes
    this.applyVolumeSettings();
    
    // Save to localStorage
    this.saveVolumeSettings();
  }
  
  setMusicVolume(volume: number): void {
    volume = Math.min(1, Math.max(0, volume));
    this.volumes.music = volume;
    
    // Update music sound volumes
    this.applyVolumeToCategory('music');
    
    // Save to localStorage
    this.saveVolumeSettings();
  }
  
  setEffectsVolume(volume: number): void {
    volume = Math.min(1, Math.max(0, volume));
    this.volumes.effects = volume;
    
    // Update effects sound volumes
    this.applyVolumeToCategory('effects');
    
    // Save to localStorage
    this.saveVolumeSettings();
  }
  
  setVoiceVolume(volume: number): void {
    volume = Math.min(1, Math.max(0, volume));
    this.volumes.voice = volume;
    
    // Update voice sound volumes
    this.applyVolumeToCategory('voice');
    
    // Save to localStorage
    this.saveVolumeSettings();
  }
  
  // Apply volume settings to all sounds
  private applyVolumeSettings(): void {
    this.applyVolumeToCategory('music');
    this.applyVolumeToCategory('effects');
    this.applyVolumeToCategory('voice');
  }
  
  // Apply volume to a specific category of sounds
  private applyVolumeToCategory(category: 'music' | 'effects' | 'voice'): void {
    const soundKeys = category === 'music' ? this.musicSounds : 
                     category === 'effects' ? this.effectSounds :
                     this.voiceSounds;
                     
    const categoryVolume = category === 'music' ? this.volumes.music : 
                          category === 'effects' ? this.volumes.effects :
                          this.volumes.voice;
                          
    // Calculate final volume with master volume
    const finalVolume = categoryVolume * this.volumes.master;
    
    // Apply to all sounds in this category with type assertion
    soundKeys.forEach(key => {
      const sound = this.sounds.get(key);
      if (sound) {
        try {
          (sound as any).volume = finalVolume;
        } catch (error) {
          console.error(`Error setting volume for "${key}":`, error);
        }
      }
    });
  }
  
  // Save volume settings to localStorage
  private saveVolumeSettings(): void {
    try {
      localStorage.setItem('aztecEscape_volumeSettings', JSON.stringify(this.volumes));
    } catch (e) {
      console.warn('Could not save volume settings:', e);
    }
  }
  
  // Load volume settings from localStorage
  private loadVolumeSettings(): void {
    try {
      const savedSettings = localStorage.getItem('aztecEscape_volumeSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings) as Partial<VolumeSettings>;
        
        // Apply saved values, keeping defaults for any missing properties
        this.volumes = {
          master: parsed.master ?? this.volumes.master,
          music: parsed.music ?? this.volumes.music,
          effects: parsed.effects ?? this.volumes.effects,
          voice: parsed.voice ?? this.volumes.voice
        };
        
        console.log('Loaded volume settings:', this.volumes);
      }
    } catch (e) {
      console.warn('Could not load volume settings:', e);
    }
  }
  
  // Get current volume settings
  getVolumeSettings(): VolumeSettings {
    return { ...this.volumes };
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
