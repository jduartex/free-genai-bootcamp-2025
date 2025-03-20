import Phaser from 'phaser';

/**
 * Manages audio file paths and loading with optimized version support
 */
export class AudioManager {
  private static instance: AudioManager;
  private scene: Phaser.Scene | null = null;
  private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();
  private isMuted: boolean = false;
  private static useOptimizedAudio: boolean = true;
  private static _initialized: boolean = false;
  
  /**
   * Get the singleton instance of AudioManager
   */
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }
  
  /**
   * Initialize with a scene
   */
  public init(scene: Phaser.Scene): void {
    this.scene = scene;
    console.log('AudioManager initialized with scene:', scene.scene.key);
    
    // Pre-load essential sounds if they don't exist
    this.preloadEssentialSounds();
  }
  
  /**
   * Preload essential sound effects that are needed immediately
   */
  private preloadEssentialSounds(): void {
    if (!this.scene) return;
    
    // Check if we need to load the theme
    if (!this.scene.cache.audio.exists('theme')) {
      console.log('AudioManager: Preloading theme music');
      this.scene.load.audio('theme', 'assets/audio/theme.mp3');
      
      // Wait for load completion to add them to our sounds map
      this.scene.load.once('complete', () => {
        console.log('AudioManager: Essential sounds loaded');
      });
      
      // Start the loading process
      this.scene.load.start();
    }
  }
  
  /**
   * Play a sound with error handling
   */
  public playSound(key: string, config?: Phaser.Types.Sound.SoundConfig): Phaser.Sound.BaseSound | null {
    if (!this.scene || this.isMuted) return null;
    
    try {
      // Check if sound exists in cache
      if (!this.scene.cache.audio.exists(key)) {
        console.warn(`Sound "${key}" not found in cache`);
        return null;
      }
      
      // Get from our map or create
      let sound = this.sounds.get(key);
      if (!sound) {
        sound = this.scene.sound.add(key, config);
        this.sounds.set(key, sound);
      }
      
      sound.play();
      return sound;
    } catch (error) {
      console.error(`Error playing sound "${key}":`, error);
      return null;
    }
  }
  
  /**
   * Set whether to use optimized audio paths
   */
  public static setUseOptimizedAudio(value: boolean): void {
    AudioManager.useOptimizedAudio = value;
  }
  
  /**
   * Get the path for an audio file, potentially using optimized version
   */
  public static getAudioPath(basePath: string, filename: string): string {
    if (AudioManager.useOptimizedAudio) {
      const extension = filename.split('.').pop();
      const name = filename.substring(0, filename.lastIndexOf('.'));
      return `audio/optimized/${name}.${extension}`;
    }
    return `${basePath}${filename}`;
  }

  /**
   * Get whether optimized audio is enabled
   */
  public static getUseOptimizedAudio(): boolean {
    return this.useOptimizedAudio;
  }

  /**
   * Initialize the AudioManager with manifest data
   * @param manifest The asset manifest containing audio paths
   */
  public static initializeWithManifest(manifest: any): void {
    if (manifest && manifest.audio && Array.isArray(manifest.audio)) {
      console.log('AudioManager: Initializing with manifest data');
      this._initialized = true;
    }
  }
  
  /**
   * Create an array of fallback paths to try for audio loading
   * @param category The audio category
   * @param filename The audio filename with extension
   * @returns Array of paths to try in order
   */
  public static getFallbackPaths(category: string, filename: string): string[] {
    const normalizedFilename = this.normalizeFilename(filename);
    
    // Try various path combinations
    return [
      // Optimized paths
      `audio/optimized/${category}/${normalizedFilename}`,
      `audio/optimized/${normalizedFilename}`,
      
      // Regular paths
      `audio/${category}/${normalizedFilename}`,
      `audio/${normalizedFilename}`,
      
      // Legacy paths with assets prefix
      `assets/audio/${category}/${normalizedFilename}`,
      `assets/audio/${normalizedFilename}`,
      
      // Try alternative separators
      `audio/${category}/${this.getAlternativeName(normalizedFilename)}`,
      `audio/${this.getAlternativeName(normalizedFilename)}`,
      `audio/optimized/${this.getAlternativeName(normalizedFilename)}`
    ];
  }

  /**
   * Normalize filename to handle different naming conventions
   */
  private static normalizeFilename(filename: string): string {
    return filename.toLowerCase();
  }
  
  /**
   * Get alternative name with different separator (_/-)
   */
  private static getAlternativeName(filename: string): string {
    if (filename.includes('-')) {
      return filename.replace(/-/g, '_');
    } else if (filename.includes('_')) {
      return filename.replace(/_/g, '-');
    }
    return filename;
  }
}

export default AudioManager;
