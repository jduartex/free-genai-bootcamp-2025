import Phaser from 'phaser';
import { AssetLoader, preloadAssets } from '../utils/AssetLoader';
import { loadStoryData } from '../utils/StoryLoader';
import { setupGlobalErrorHandlers } from '../utils/ErrorHandler';
import { generateUIAssets } from '../utils/UIAssetGenerator';
import { AssetManager } from '../utils/AssetManager';
import { AudioManager } from '../utils/AudioManager';
import { DevConfig } from '../utils/DevConfig';

export class PreloadScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private assetLoader!: AssetLoader;

  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Setup error handlers
    setupGlobalErrorHandlers();
    
    // Initialize AudioManager based on DevConfig
    AudioManager.setUseOptimizedAudio(DevConfig.useOptimizedAudio);
    
    // Create loading UI
    this.createLoadingUI();
    
    // Initialize AssetLoader
    this.assetLoader = new AssetLoader(this);
    
    // Preload assets common to all scenes
    preloadAssets(this);
    
    // Setup progress tracking
    this.load.on('progress', (value: number) => {
      this.updateLoadingBar(value);
    });
    
    this.load.on('complete', () => {
      this.loadingText.setText('Loading complete!');
      this.time.delayedCall(500, this.startGame, [], this);
    });
  }

  create(): void {
    // This runs after preload is complete
    // Generate UI assets if they're missing
    generateUIAssets(this);
    
    // Initialize the AssetManager with this scene
    const assetManager = AssetManager.getInstance(this);
    
    // Verify all required assets exist
    assetManager.verifyRequiredAssets();
  }

  private createLoadingUI(): void {
    // Create loading background
    this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000
    );
    
    // Create loading bar container
    this.loadingBar = this.add.graphics();
    this.loadingBar.fillStyle(0x222222, 1);
    this.loadingBar.fillRect(
      this.cameras.main.width / 4,
      this.cameras.main.height / 2 - 30,
      this.cameras.main.width / 2,
      60
    );
    
    // Create progress bar
    this.progressBar = this.add.graphics();
    
    // Add loading text
    this.loadingText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 50,
      'Loading game assets...',
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
  }
  
  private updateLoadingBar(value: number): void {
    // Update progress bar
    this.progressBar.clear();
    this.progressBar.fillStyle(0xffffff, 1);
    this.progressBar.fillRect(
      this.cameras.main.width / 4 + 10,
      this.cameras.main.height / 2 - 20,
      (this.cameras.main.width / 2 - 20) * value,
      40
    );
    
    // Update loading text
    const percent = Math.floor(value * 100);
    this.loadingText.setText(`Loading game assets... ${percent}%`);
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
      
      // Add audio unlock button
      this.addAudioUnlockButton();
      
      // Proceed to menu
      this.scene.start('MenuScene');
    } catch (error) {
      console.error('Failed to start game:', error);
      
      // Show error and still try to start menu
      this.loadingText.setText('Error loading game data. Attempting to continue...');
      this.time.delayedCall(2000, () => {
        this.scene.start('MenuScene');
      });
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
  
  /**
   * Add an audio unlock button to help with browser audio restrictions
   */
  private addAudioUnlockButton(): void {
    // Only import if available - using dynamic import to avoid issues
    import('../utils/AudioUnlockManager').then(module => {
      const AudioUnlockManager = module.AudioUnlockManager;
      AudioUnlockManager.addUnlockButton(this);
    }).catch(error => {
      console.warn('Could not load AudioUnlockManager:', error);
    });
  }
}
