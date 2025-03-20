/**
 * Manages audio file paths and loading with optimized version support
 */
export class AudioManager {
  private static _useOptimizedAudio: boolean = true;
  private static _initialized: boolean = false;
  
  /**
   * Set whether to use optimized audio files
   */
  public static setUseOptimizedAudio(value: boolean): void {
    this._useOptimizedAudio = value;
  }
  
  /**
   * Get whether optimized audio is enabled
   */
  public static getUseOptimizedAudio(): boolean {
    return this._useOptimizedAudio;
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
   * Get the path for an audio file, using optimized version if available
   * @param category The audio category (can be empty for root audio folder)
   * @param filename The audio filename with extension
   * @returns The path to the audio file
   */
  public static getAudioPath(category: string, filename: string): string {
    // Normalize the filename to handle both formats (with - or _)
    const normalizedFilename = this.normalizeFilename(filename);
    
    let result = '';
    if (this._useOptimizedAudio) {
      // For optimized audio, all files go in the optimized folder
      // but we preserve the subdirectory structure
      if (category && category !== '') {
        result = `audio/optimized/${category}/${normalizedFilename}`;
      } else {
        result = `audio/optimized/${normalizedFilename}`;
      }
    } else {
      // For original audio, use the standard directory structure
      if (category && category !== '') {
        result = `audio/${category}/${normalizedFilename}`;
      } else {
        result = `audio/${normalizedFilename}`;
      }
    }
    
    console.log(`AudioManager.getAudioPath(${category}, ${filename}) => ${result}`);
    return result;
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
