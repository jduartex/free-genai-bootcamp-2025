import Phaser from 'phaser';
import { AssetLoader, preloadAssets } from '../utils/AssetLoader';
import { loadStoryData } from '../utils/StoryLoader';
import { setupGlobalErrorHandlers } from '../utils/ErrorHandler';
import { generateUIAssets } from '../utils/UIAssetGenerator';
import { AssetManager } from '../utils/AssetManager';

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
      
      // Make sure UI assets are generated
      generateUIAssets(this);
      
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
}
