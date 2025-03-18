import Phaser from 'phaser';
import fs from 'fs';
import path from 'path';
import { mappings } from '@/utils/Mappings';

export class LoadScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private assetManifest: any = null;

  constructor() {
    super({ key: 'LoadScene' });
  }

  preload(): void {
    // Create loading UI
    this.createLoadingUI();
    
    // Track loading progress
    this.load.on('progress', (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0xffffff, 1);
      this.progressBar.fillRect(
        this.cameras.main.width / 4, 
        this.cameras.main.height / 2, 
        (this.cameras.main.width / 2) * value, 
        30
      );
      this.loadingText.setText(`Loading assets: ${Math.floor(value * 100)}%`);
    });

    // Load our manifest file if it exists in browser-safe manner
    this.loadAssetManifest().then(() => {
      // Load the assets
      this.loadGameAssets();
    });
  }

  create(): void {
    this.loadingText.setText('Starting game...');
    
    // Fade out and show the menu
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(500, () => {
      this.scene.start('MenuScene');
    });
  }

  private async loadAssetManifest(): Promise<void> {
    try {
      // In a browser, fetch the manifest file
      if (typeof window !== 'undefined') {
        const response = await fetch('/assets/asset-manifest.json');
        if (response.ok) {
          this.assetManifest = await response.json();
          console.log('Loaded asset manifest:', this.assetManifest);
        } else {
          console.warn('Asset manifest not found, using defaults');
        }
      } 
      // In Node.js, read the file directly (not normally used)
      else {
        const manifestPath = path.resolve(process.cwd(), 'public/assets/asset-manifest.json');
        if (fs.existsSync(manifestPath)) {
          const data = fs.readFileSync(manifestPath, 'utf8');
          this.assetManifest = JSON.parse(data);
        }
      }
    } catch (error) {
      console.warn('Error loading asset manifest:', error);
    }
  }

  private loadGameAssets(): void {
    // Get list of locations from mappings
    const locations = mappings.locations || {};
    const characterNames = mappings.characterNames || {};
    
    // Load background scenes
    this.loadingText.setText('Loading backgrounds...');
    
    // Load each scene background
    Object.keys(locations).forEach(locationId => {
      this.load.image(locationId, `assets/scenes/${locationId.replace('_', '-')}.jpg`);
      console.log(`Loading scene: ${locationId}`);
    });
    
    // Load character portraits
    this.loadingText.setText('Loading characters...');
    
    // Load each character
    Object.keys(characterNames).forEach(characterId => {
      this.load.image(characterId, `assets/characters/${characterId}.png`);
      console.log(`Loading character: ${characterId}`);
    });
    
    // Load UI elements
    this.loadingText.setText('Loading UI elements...');
    this.load.image('dialog-box', 'assets/ui/dialog-box.png');
    this.load.image('button-default', 'assets/ui/button-default.png');
    this.load.image('menu-background', 'assets/ui/menu-background.png');
    
    // Add some error handling for missing assets
    this.load.on('filecomplete', (key: string, type: string, data: any) => {
      console.log(`Successfully loaded: ${key} (${type})`);
    });
    
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn(`Error loading file: ${file.key} from ${file.src}`);
      
      // Create a simple placeholder for missing images
      if (file.type === 'image') {
        this.createPlaceholderImage(file.key);
      }
    });
  }
  
  private createPlaceholderImage(key: string): void {
    // Create a simple colored rectangle as placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Use different colors for different asset types
      let color = '#444444';
      if (key.includes('dialog')) color = '#664444';
      else if (key.includes('button')) color = '#446644';
      else if (key.includes('character')) color = '#444466';
      
      // Fill background
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add text
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Missing: ${key}`, canvas.width / 2, canvas.height / 2);
      
      // Create texture from canvas
      this.textures.addCanvas(key, canvas);
      console.log(`Created placeholder for: ${key}`);
    }
  }

  private createLoadingUI(): void {
    // Background
    this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000
    );
    
    // Title
    this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 3,
      'Aztec Escape',
      {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // Loading text
    this.loadingText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 50,
      'Loading assets: 0%',
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // Progress bar background
    this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width / 2,
      30,
      0x666666
    ).setOrigin(0.5);
    
    // Progress bar
    this.progressBar = this.add.graphics();
  }
}
