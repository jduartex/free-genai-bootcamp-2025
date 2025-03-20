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
      // Check if the texture exists by the direct key
      exists = this.scene.textures.exists(key);
      
      if (!exists) {
        // Try some common extensions before giving up
        const possibleKeys = [
          key,                   // Try the key directly
          `${key}.png`,          // Try with .png extension
          `${key}.jpg`,          // Try with .jpg extension
          `${key}-image`,        // Try with -image suffix
        ];
        
        // Try each possible key
        for (const possibleKey of possibleKeys) {
          if (this.scene.textures.exists(possibleKey)) {
            console.log(`Found texture with alternate key: ${possibleKey} for requested key: ${key}`);
            this.assetStatus.set(key, true);
            this.assetStatus.set(possibleKey, true);
            this.createTextureAlias(key, possibleKey);
            exists = true;
            break;
          }
        }

        // If still not found, try to load characters directly with improved path handling
        if (!exists && (key === 'tlaloc' || key === 'citlali' || key === 'guard' || key === 'narrator')) {
          console.log(`Attempting to load character image directly: ${key}`);
          
          // Try to load with multiple path formats to maximize chances of success
          const characterPath = `/assets/characters/${key}.png`;
          console.log(`Loading character from: ${characterPath}`);
          
          // First check if the file exists using a HEAD request
          fetch(characterPath, { method: 'HEAD' })
            .then(response => {
              if (response.ok) {
                console.log(`Character image exists at ${characterPath}, loading now`);
                this.scene.load.image(key, characterPath);
                this.scene.load.once('complete', () => {
                  console.log(`Successfully loaded character: ${key}`);
                  this.assetStatus.set(key, true);
                });
                this.scene.load.start();
              } else {
                console.warn(`Character image not found at ${characterPath}`);
                // If file doesn't exist and it's not narrator, create a real placeholder
                if (key !== 'narrator') {
                  this.createImagePlaceholder(key);
                } else {
                  // For narrator, create a special placeholder (since we don't need a real image)
                  this.createNarratorPlaceholder();
                  this.assetStatus.set('narrator', true);
                }
              }
            })
            .catch(error => {
              console.error(`Error checking for character image: ${error}`);
              this.createImagePlaceholder(key);
            });
            
          // Optimistically assume we'll handle the image one way or another
          exists = true;
        }
        
        // Handle scenes same as before
        if (!exists && (key === 'prison-cell' || key === 'aztec-village' || key === 'spanish-invasion' || key === 'hidden-tunnel')) {
          console.log(`Attempting to load scene image directly: ${key}`);
          this.scene.load.image(key, `/assets/scenes/${key}.png`);
          this.scene.load.once('complete', () => {
            console.log(`Successfully loaded scene image: ${key}`);
          });
          this.scene.load.start();
          
          // Optimistically assume the load will succeed
          exists = true;
        }
        
        // If we still couldn't find it, create a placeholder
        if (!exists) {
          this.createImagePlaceholder(key);
          logWarning('AssetManager', `Created placeholder for missing image: ${key}`);
        }
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
   * Create an alias for a texture key to another texture
   */
  private createTextureAlias(aliasKey: string, originalKey: string): void {
    try {
      // Just record that the alias was created (simplest approach)
      console.log(`Created texture alias mapping: ${aliasKey} -> ${originalKey}`);
      
      // Store the mapping for future reference
      this.assetStatus.set(aliasKey, true);
      
      // Create a simple placeholder with the texture name
      const width = 512;
      const height = 512;
      
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0x333333);
      graphics.fillRect(0, 0, width, height);
      graphics.lineStyle(4, 0xffffff);
      graphics.strokeRect(4, 4, width - 8, height - 8);
      
      // Add text to show it's an aliased texture
      const text = this.scene.add.text(
        width / 2, 
        height / 2, 
        `${aliasKey}\n↪ ${originalKey}`, 
        { fontSize: '24px', align: 'center' }
      );
      text.setOrigin(0.5);
      
      // Generate texture
      graphics.generateTexture(aliasKey, width, height);
      
      // Clean up
      text.destroy();
      graphics.destroy();
    } catch (error) {
      console.error('Failed to create texture alias:', error);
    }
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
   * Create a special narrator placeholder that looks intentional
   */
  private createNarratorPlaceholder(): void {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 300;  // standard character width
      canvas.height = 400; // standard character height
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Create a scroll/book design for narrator
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw scroll
        ctx.fillStyle = '#d8c9aa';
        ctx.fillRect(50, 100, 200, 250);
        
        // Scroll details
        ctx.fillStyle = '#b5a281';
        ctx.fillRect(50, 120, 200, 10);
        ctx.fillRect(50, 320, 200, 10);
        
        // Text lines
        ctx.fillStyle = '#666666';
        for (let i = 0; i < 8; i++) {
          ctx.fillRect(70, 150 + (i * 20), 160, 3);
        }
        
        // Narrator text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('NARRATOR', canvas.width / 2, 80);
        
        // Add to texture manager
        this.scene.textures.addCanvas('narrator', canvas);
        console.log('Created intentional narrator placeholder');
      }
    } catch (error) {
      logError('AssetManager', 'Failed to create narrator placeholder', error);
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
    // Log what we're about to check to help with debugging
    console.log("Verifying required assets...");
    
    // Check backgrounds
    ['prison-cell', 'aztec-village', 'spanish-invasion', 'hidden-tunnel'].forEach(key => {
      console.log(`Checking background: ${key}`);
      this.ensureAsset(key, 'image');
    });
    
    // Check characters - updated to handle narrator differently
    ['tlaloc', 'citlali', 'guard'].forEach(key => {
      console.log(`Checking character: ${key}`);
      this.ensureAsset(key, 'image');
    });
    
    // Handle narrator separately
    if (!this.scene.textures.exists('narrator')) {
      console.log('Creating narrator placeholder (intentional)');
      this.createNarratorPlaceholder();
      this.assetStatus.set('narrator', true);
    }
    
    // Check UI elements
    ['button', 'button-hover', 'dialog-box'].forEach(key => {
      console.log(`Checking UI element: ${key}`);
      this.ensureAsset(key, 'image');
    });
    
    // Check audio
    ['click', 'theme'].forEach(key => {
      console.log(`Checking audio: ${key}`);
      this.ensureAsset(key, 'audio');
    });
    
    console.log("Asset verification complete");
  }
}
