import Phaser from 'phaser';
import fs from 'fs';
import path from 'path';
import { BACKGROUND_MAPPINGS, CHARACTER_MAPPINGS, mappings } from '../utils/Mappings';

export class LoadScene extends Phaser.Scene {
  private assetManifest: any = null;

  constructor() {
    super({ key: 'LoadScene' });
  }

  preload(): void {
    // Track loading progress - no UI, just events
    this.load.on('progress', (value: number) => {
      // Notify MenuScene of progress
      this.events.emit('progress', value);
    });
    
    // Add complete listener
    this.load.on('complete', () => {
      console.log('Asset loading complete');
      this.events.emit('complete');
    });

    // Load our manifest file if it exists in browser-safe manner
    this.loadAssetManifest().then(() => {
      // Load the assets
      this.loadGameAssets();
      
      // Explicitly start the loader
      this.load.start();
    });
  }

  create(): void {
    // No need to do anything here as we'll stay in the background
    console.log("LoadScene create completed");
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
    // Get list of locations from mappings or use BACKGROUND_MAPPINGS as fallback
    const locations = mappings?.locations || BACKGROUND_MAPPINGS;
    const characterNames = mappings?.characterNames || CHARACTER_MAPPINGS;
    
    // Load background scenes
    console.log('Loading backgrounds...');
    
    // Load each scene background
    Object.keys(locations).forEach(locationId => {
      this.load.image(locationId, `assets/scenes/${locationId.replace('_', '-')}.jpg`);
      console.log(`Loading scene: ${locationId}`);
    });
    
    // Load character portraits
    console.log('Loading characters...');
    
    // Load each character
    Object.keys(characterNames).forEach(characterId => {
      this.load.image(characterId, `assets/characters/${characterId}.png`);
      console.log(`Loading character: ${characterId}`);
    });
    
    // Load UI elements
    console.log('Loading UI elements...');
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
}
