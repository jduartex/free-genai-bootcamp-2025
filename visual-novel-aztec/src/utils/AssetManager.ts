import Phaser from 'phaser';
import { generateUIAssets } from './UIAssetGenerator';
import { logError, logWarning } from './ErrorHandler';

/**
 * Centralized asset management system
 */
export class AssetManager {
  private static instance: AssetManager;
  private scene: Phaser.Scene;
  private assetStatus: Map<string, boolean> = new Map();

  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Get the singleton instance of AssetManager
   */
  public static getInstance(scene?: Phaser.Scene): AssetManager {
    if (!AssetManager.instance && scene) {
      AssetManager.instance = new AssetManager(scene);
    } else if (!AssetManager.instance) {
      throw new Error('AssetManager not initialized with a scene');
    }
    return AssetManager.instance;
  }

  /**
   * Update the scene reference if needed
   */
  public setScene(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  /**
   * Check if an asset exists and fallback to placeholder if not
   */
  public ensureAsset(key: string, type: 'image' | 'audio' | 'object'): boolean {
    // Check if we've already verified this asset
    if (this.assetStatus.has(key)) {
      return this.assetStatus.get(key) || false;
    }

    let exists = false;

    if (type === 'image') {
      // Check if the texture exists
      exists = this.scene.textures.exists(key);
      if (!exists) {
        // Try creating a placeholder
        this.createImagePlaceholder(key);
        logWarning('AssetManager', `Created placeholder for missing image: ${key}`);
      }
    } else if (type === 'audio') {
      // Check if the audio exists in cache
      exists = this.scene.cache.audio.exists(key);
      if (!exists) {
        // Try creating a placeholder
        this.createAudioPlaceholder(key);
        logWarning('AssetManager', `Created placeholder for missing audio: ${key}`);
      }
    }

    // Store the status for future reference
    this.assetStatus.set(key, exists);
    
    return exists;
  }

  /**
   * Create placeholder for a missing image
   */
  private createImagePlaceholder(key: string): void {
    try {
      // Extract type from key name for better coloring
      let bgColor = '#444444';
      if (key.includes('button')) bgColor = '#446644';
      if (key.includes('character')) bgColor = '#664444';
      if (key.includes('scene')) bgColor = '#444466';
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Fill background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
        
        // Add text
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Missing: ${key}`, canvas.width / 2, canvas.height / 2);
        
        // Add to texture manager
        this.scene.textures.addCanvas(key, canvas);
      }
    } catch (error) {
      logError('AssetManager', `Failed to create image placeholder for ${key}`, error);
    }
  }

  /**
   * Create placeholder for missing audio
   */
  private createAudioPlaceholder(key: string): void {
    // This uses the same approach as in AssetLoader.ts
    try {
      // Type guard to check if we're using WebAudioSoundManager
      const soundManager = this.scene.sound;
      if ('context' in soundManager && soundManager.context) {
        const audioContext = soundManager.context;
        const buffer = audioContext.createBuffer(1, 22050, 22050);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        
        // Add to cache
        this.scene.cache.audio.add(key, buffer);
      } else {
        // Create a dummy object that can be added to cache
        const dummyBuffer = { duration: 0.5, numberOfChannels: 1 };
        this.scene.cache.audio.add(key, dummyBuffer);
      }
    } catch (error) {
      logError('AssetManager', `Failed to create audio placeholder for ${key}`, error);
    }
  }

  /**
   * Generate all missing UI assets
   */
  public generateMissingUIAssets(): void {
    generateUIAssets(this.scene);
  }

  /**
   * Verify all required assets exist and create placeholders if needed
   */
  public verifyRequiredAssets(): void {
    // Check backgrounds
    ['prison-cell', 'aztec-village', 'spanish-invasion', 'hidden-tunnel'].forEach(key => {
      this.ensureAsset(key, 'image');
    });
    
    // Check characters
    ['tlaloc', 'citlali', 'diego', 'narrator'].forEach(key => {
      this.ensureAsset(key, 'image');
    });
    
    // Check UI elements
    ['button', 'button-hover', 'dialog-box'].forEach(key => {
      this.ensureAsset(key, 'image');
    });
    
    // Check audio
    ['click', 'theme'].forEach(key => {
      this.ensureAsset(key, 'audio');
    });
  }
}
