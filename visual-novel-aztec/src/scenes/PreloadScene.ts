import Phaser from 'phaser';
import { AssetLoader, preloadAssets } from '../utils/AssetLoader';
import { loadStoryData } from '../utils/StoryLoader';
import { setupGlobalErrorHandlers } from '../utils/ErrorHandler';
import { generateUIAssets } from '../utils/UIAssetGenerator';
import { AssetManager } from '../utils/AssetManager';
import { AudioManager } from '../utils/AudioManager';
import { DevConfig } from '../utils/DevConfig';

export class PreloadScene extends Phaser.Scene {
  private assetLoader!: AssetLoader;

  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Setup error handlers
    setupGlobalErrorHandlers();
    
    // Initialize AudioManager based on DevConfig
    AudioManager.setUseOptimizedAudio(DevConfig.useOptimizedAudio);
    
    // Initialize AssetLoader (no UI elements)
    this.assetLoader = new AssetLoader(this);
    
    // Preload assets common to all scenes
    preloadAssets(this);
    
    // Setup progress tracking - send progress to MenuScene
    this.load.on('progress', (value: number) => {
      // Emit progress event for MenuScene to track
      this.events.emit('progress', value);
    });
    
    this.load.on('complete', () => {
      console.log('PreloadScene loading complete!');
      this.events.emit('complete');
    });
  }

  create(): void {
    // Generate UI assets if they're missing
    generateUIAssets(this);
    
    // Initialize the AssetManager with this scene
    const assetManager = AssetManager.getInstance(this);
    
    // Verify all required assets exist
    assetManager.verifyRequiredAssets();
    
    this.startGame();
  }
  
  private async startGame(): Promise<void> {
    try {
      // Load game data asynchronously
      await loadStoryData();
      await this.assetLoader.loadAssetManifest();
      await this.assetLoader.loadMappings();
      
      // Initialize AudioManager with the manifest
      const manifest = await this.loadManifestData();
      if (manifest) {
        AudioManager.initializeWithManifest(manifest);
      }
      
      // Fix paths in asset manifest if loaded
      this.fixAssetManifestPaths();
      
      // Make sure UI assets are generated
      generateUIAssets(this);
      
      console.log('PreloadScene completed all operations');
      this.events.emit('complete');
    } catch (error) {
      console.error('Failed to start game:', error);
      this.events.emit('error', error);
    }
  }
  
  /**
   * Load manifest data directly to fix any issues
   */
  private async loadManifestData(): Promise<any> {
    try {
      const response = await fetch('/assets/asset-manifest.json');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Error loading manifest directly:', error);
    }
    return null;
  }
  
  /**
   * Fix paths in the asset manifest if needed
   */
  private fixAssetManifestPaths(): void {
    // Check if we need to fix extensions in scene paths
    if (this.assetLoader && (this.assetLoader as any).assetManifest) {
      const manifest = (this.assetLoader as any).assetManifest;
      
      // Fix scene file extensions if needed
      if (manifest.backgrounds) {
        for (const bg of manifest.backgrounds) {
          // Fix HTML extensions (error from previous implementation)
          if (bg.imagePath && bg.imagePath.endsWith('.html')) {
            console.log(`Fixing incorrect image path extension: ${bg.imagePath}`);
            bg.imagePath = bg.imagePath.replace('.html', '.png'); // Use .png instead of .jpg
          }
          
          // Add log for debugging what extensions we have in the manifest
          console.log(`Background path in manifest: ${bg.sceneName} -> ${bg.imagePath}`);
        }
      }
      
      console.log('Fixed asset manifest paths if needed');
    }
  }
}
