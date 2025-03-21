import Phaser from 'phaser';
import { AudioManager } from './AudioManager';

// Define specific types for asset entries
interface AssetEntry {
  id: string;
  path: string;
}

interface AssetManifest {
  backgrounds?: Array<{sceneName: string, imagePath: string}>;
  characters?: Array<{characterName: string, imagePath: string}>;
  ui?: Array<{elementName: string, imagePath: string}>;
  sounds?: Array<{soundName: string, soundPath: string}>;
  [key: string]: any;
}

interface AssetMappings {
  characterNames?: Record<string, string>;
  locations?: Record<string, string>;
  [key: string]: any;
}

export function preloadAssets(scene: Phaser.Scene): void {
  // Add error handler for missing assets
  scene.load.on('loaderror', (file: Phaser.Loader.File) => {
    console.warn(`Asset missing: ${file.url}, creating placeholder.`);
    
    // Create a placeholder asset based on file type
    if (file.type === 'image') {
      createImagePlaceholder(scene, file.key);
    } else if (file.type === 'audio') {
      createAudioPlaceholder(scene, file.key);
    }
  });
  
  // Basic UI assets - use absolute paths instead of relative
  scene.load.image('button', '/assets/ui/button.png');
  scene.load.image('button-hover', '/assets/ui/button-hover.png');
  scene.load.image('dialog-box', '/assets/ui/dialog-box.png');
  
  // Basic sound effects - use AudioManager with full paths
  scene.load.audio('click', '/assets/audio/optimized/' + AudioManager.getAudioPath('', 'click.mp3'));
  scene.load.audio('theme', '/assets/audio/optimized/' + AudioManager.getAudioPath('', 'theme.mp3'));
}

// Create a placeholder image in memory
function createImagePlaceholder(scene: Phaser.Scene, key: string): void {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Determine color based on asset type
    let bgColor = '#444444';
    if (key.includes('button')) bgColor = '#446644';
    if (key.includes('character')) bgColor = '#664444';
    if (key.includes('scene')) bgColor = '#444466';
    
    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add text
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Missing: ${key}`, canvas.width / 2, canvas.height / 2);
    
    // Add to texture manager
    scene.textures.addCanvas(key, canvas);
    console.log(`Created placeholder for: ${key}`);
  }
}

// Create a placeholder audio in memory
function createAudioPlaceholder(scene: Phaser.Scene, key: string): void {
  // Create minimal silent WebAudio buffer
  try {
    // Type guard to check if we're using WebAudioSoundManager
    const soundManager = scene.sound;
    if ('context' in soundManager && soundManager.context) {
      const audioContext = soundManager.context;
      const buffer = audioContext.createBuffer(1, 22050, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      
      // Add to cache
      scene.cache.audio.add(key, buffer);
      console.log(`Created silent audio placeholder for: ${key}`);
    } else {
      // Fallback for other sound managers
      console.log(`Creating dummy audio placeholder for: ${key} (no WebAudio context available)`);
      
      // Create a dummy object that can be added to cache
      const dummyBuffer = { duration: 0.5, numberOfChannels: 1 };
      scene.cache.audio.add(key, dummyBuffer);
    }
  } catch (error) {
    console.error('Failed to create audio placeholder:', error);
  }
}

/**
 * Browser-compatible asset loading utility
 * Unlike the Node.js generator, this only loads pre-generated assets
 */
export class AssetLoader {
  // Properly declare instance properties
  private readonly scene: Phaser.Scene;
  private mappings: AssetMappings;
  private assetManifest: AssetManifest | null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.mappings = {};
    this.assetManifest = null;
  }

  /**
   * Load the asset manifest file
   */
  async loadAssetManifest(): Promise<boolean> {
    try {
      const response = await fetch('/assets/asset-manifest.json');
      if (response.ok) {
        this.assetManifest = (await response.json()) as AssetManifest;
        console.log('Loaded asset manifest:', this.assetManifest);
        return true;
      } else {
        console.warn('Asset manifest not found, will use defaults');
        this.assetManifest = {}; // Initialize empty manifest
        return false;
      }
    } catch (error) {
      console.warn('Error loading asset manifest:', error);
      this.assetManifest = {}; // Initialize empty manifest
      return false;
    }
  }

  /**
   * Load mappings file
   */
  async loadMappings(): Promise<boolean> {
    try {
      const response = await fetch('/mappings.json');
      if (response.ok) {
        this.mappings = (await response.json()) as AssetMappings;
        console.log('Loaded mappings:', this.mappings);
        return true;
      } else {
        console.warn('Mappings not found, will use defaults');
        this.mappings = {}; // Initialize empty mappings
        return false;
      }
    } catch (error) {
      console.warn('Error loading mappings:', error);
      this.mappings = {}; // Initialize empty mappings
      return false;
    }
  }

  /**
   * Load all scene background images
   */
  loadBackgrounds(): void {
    // Get backgrounds from manifest or use default list
    const backgrounds = this.getBackgrounds();
    
    console.log(`Loading ${backgrounds.length} backgrounds...`);
    
    // Load each background
    for (const bg of backgrounds) {
      this.scene.load.image(bg.id, bg.path);
    }
  }
  
  /**
   * Load all character portraits
   */
  loadCharacters(): void {
    // Get characters from manifest or use default list
    const characters = this.getCharacters();
    
    console.log(`Loading ${characters.length} characters...`);
    
    // Load each character
    for (const char of characters) {
      this.scene.load.image(char.id, char.path);
    }
  }
  
  /**
   * Load all UI elements
   */
  loadUIElements(): void {
    // List of required UI elements
    const uiElements = [
      { id: 'dialog-box', path: 'assets/ui/dialog-box.png' },
      { id: 'button-default', path: 'assets/ui/button-default.png' },
      { id: 'menu-background', path: 'assets/ui/menu-background.png' }
    ];
    
    console.log(`Loading ${uiElements.length} UI elements...`);
    
    // Load each UI element
    for (const ui of uiElements) {
      this.scene.load.image(ui.id, ui.path);
    }
  }
  
  /**
   * Load common audio files
   */
  loadAudioFiles(): void {
    const audioFiles = [
      { id: 'click', file: 'click.mp3' },
      { id: 'theme', file: 'theme.mp3' },
      { id: 'hover', file: 'hover.mp3' },
      { id: 'success', file: 'success.mp3' },
      { id: 'fail', file: 'fail.mp3' }
    ];
    
    console.log(`Loading ${audioFiles.length} audio files...`);
    
    // Load each audio file with full path
    for (const audio of audioFiles) {
      const path = '/assets/audio/optimized/' + AudioManager.getAudioPath('', audio.file);
      console.log(`Loading audio: ${audio.id} from ${path}`);
      this.scene.load.audio(audio.id, path);
    }
    
    // Also load ambient sounds
    this.loadAmbientSounds();
  }
  
  /**
   * Load ambient sounds
   */
  loadAmbientSounds(): void {
    const ambientSounds = [
      { id: 'prison-ambience', file: 'prison-ambience.mp3' },
      { id: 'village-ambience', file: 'village-ambience.mp3' },
      { id: 'battle-ambience', file: 'battle-ambience.mp3' },
      { id: 'tunnel-ambience', file: 'tunnel-ambience.mp3' }
    ];
    
    // Load each ambient sound with optimized path
    for (const sound of ambientSounds) {
      this.scene.load.audio(sound.id, AudioManager.getAudioPath('', sound.file));
    }
  }
  
  /**
   * Get background IDs and paths from manifest or default mappings
   */
  private getBackgrounds(): Array<AssetEntry> {
    if (this.assetManifest?.backgrounds?.length) {
      return this.assetManifest.backgrounds.map((bg) => ({
        id: bg.sceneName,
        path: bg.imagePath
      }));
    }

    if (this.mappings?.locations) {
      // Use .png extension to match the actual files
      return Object.keys(this.mappings.locations).map((id) => ({
        id,
        path: `assets/scenes/${id}.png`
      }));
    }

    // Updated default paths to use .png extension
    return [
      { id: 'prison-cell', path: 'assets/scenes/prison-cell.png' },
      { id: 'aztec-village', path: 'assets/scenes/aztec-village.png' },
      { id: 'spanish-invasion', path: 'assets/scenes/spanish-invasion.png' },
      { id: 'hidden-tunnel', path: 'assets/scenes/hidden-tunnel.png' }
    ];
  }
  
  /**
   * Get character IDs and paths from manifest or default mappings
   */
  private getCharacters(): Array<AssetEntry> {
    if (this.assetManifest?.characters?.length) {
      return this.assetManifest.characters.map((char) => ({
        id: char.characterName,
        path: char.imagePath
      }));
    }

    if (this.mappings?.characterNames) {
      return Object.keys(this.mappings.characterNames).map((id) => ({
        id,
        path: `assets/characters/${id}.png`
      }));
    }

    return [
      { id: 'tlaloc', path: 'assets/characters/tlaloc.png' },
      { id: 'citlali', path: 'assets/characters/citlali.png' },
      { id: 'diego', path: 'assets/characters/diego.png' },
      { id: 'narrator', path: 'assets/characters/narrator.png' }
    ];
  }
  
  /**
   * Create placeholder for missing images
   * @returns The created texture key if successful
   */
  createPlaceholder(key: string, width: number = 512, height: number = 512): string | undefined {
    if (!key || typeof key !== 'string') {
      console.error('Invalid key provided to createPlaceholder');
      return undefined;
    }
    
    // Make sure we have a scene to work with
    if (!this.scene || !this.scene.textures) {
      console.error('No valid scene available for creating placeholders');
      return undefined;
    }
    
    // Don't recreate if it already exists
    if (this.scene.textures.exists(key)) {
      return key;
    }
    
    // Adjust dimensions to be reasonable if they're extreme
    width = Math.min(Math.max(width, 16), 1024);
    height = Math.min(Math.max(height, 16), 1024);
    
    try {
      // Create a graphics object to draw the placeholder
      const graphics = this.scene.add.graphics();
      
      // Draw a colorful placeholder with text
      graphics.fillStyle(0x333333, 1);
      graphics.fillRect(0, 0, width, height);
      
      // Add a border
      graphics.lineStyle(4, 0xff6600, 1);
      graphics.strokeRect(2, 2, width - 4, height - 4);
      
      // Add diagonal pattern
      graphics.lineStyle(2, 0xffcc00, 0.5);
      for (let i = 0; i < width + height; i += 20) {
        graphics.beginPath();
        graphics.moveTo(0, i);
        graphics.lineTo(i, 0);
        graphics.strokePath();
      }
      
      // Generate the texture
      graphics.generateTexture(key, width, height);
      graphics.destroy();
      
      console.log(`Created placeholder texture for: ${key} (${width}x${height})`);
      return key;
    } catch (graphicsError) {
      console.error(`Graphics fallback failed for ${key}:`, graphicsError);
    }
    
    return undefined;
  }

  /**
   * Get a texture by key from the scene's texture manager
   * @param key The texture key to retrieve
   * @returns The texture or undefined if not found
   */
  public getImageKey(key: string): Phaser.Textures.Texture | undefined {
    if (this.scene && this.scene.textures && this.scene.textures.exists(key)) {
      return this.scene.textures.get(key);
    }
    return undefined;
  }
}
