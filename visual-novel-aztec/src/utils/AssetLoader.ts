import Phaser from 'phaser';

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
  // Background images
  scene.load.image('prison-cell', 'assets/scenes/prison-cell.jpg');
  scene.load.image('aztec-village', 'assets/scenes/aztec-village.jpg');
  scene.load.image('spanish-invasion', 'assets/scenes/spanish-invasion.jpg');
  scene.load.image('hidden-tunnel', 'assets/scenes/hidden-tunnel.jpg');
  
  // Character images
  scene.load.image('tlaloc', 'assets/characters/tlaloc.png');
  scene.load.image('citlali', 'assets/characters/citlali.png');
  scene.load.image('diego', 'assets/characters/diego.png');
  
  // UI elements
  scene.load.image('dialog-box', 'assets/ui/dialog_box.png');
  scene.load.image('timer', 'assets/ui/timer.png');
  scene.load.image('button', 'assets/ui/button.png');
  scene.load.image('button-hover', 'assets/ui/button_hover.png');
  scene.load.image('inventory-icon', 'assets/ui/inventory_icon.png');
  scene.load.image('help-icon', 'assets/ui/help_icon.png');
  
  // Interactive objects
  scene.load.image('window', 'assets/objects/window.png');
  scene.load.image('floor-pattern', 'assets/objects/floor_pattern.png');
  scene.load.image('bed', 'assets/objects/bed.png');
  scene.load.image('door', 'assets/objects/door.png');
  scene.load.image('temple', 'assets/objects/temple.png');
  scene.load.image('return-arrow', 'assets/ui/return_arrow.png');
  scene.load.image('exit', 'assets/objects/exit.png');
  
  // Audio
  scene.load.audio('theme', 'assets/audio/theme.mp3');
  scene.load.audio('click', 'assets/audio/click.mp3');
  scene.load.audio('hover', 'assets/audio/hover.mp3');
  scene.load.audio('success', 'assets/audio/success.mp3');
  scene.load.audio('fail', 'assets/audio/fail.mp3');
  scene.load.audio('warning', 'assets/audio/warning.mp3');
  scene.load.audio('pickup', 'assets/audio/pickup.mp3');
  scene.load.audio('prison-ambience', 'assets/audio/prison_ambience.mp3');
  scene.load.audio('village-ambience', 'assets/audio/village_ambience.mp3');
  scene.load.audio('battle-ambience', 'assets/audio/battle_ambience.mp3');
  scene.load.audio('tunnel-ambience', 'assets/audio/tunnel_ambience.mp3');

  const assets = [
    { key: 'prison-cell', path: 'assets/scenes/prison-cell.jpg' },
    { key: 'aztec-village', path: 'assets/scenes/aztec-village.jpg' },
    { key: 'spanish-invasion', path: 'assets/scenes/spanish-invasion.jpg' },
    { key: 'hidden-tunnel', path: 'assets/scenes/hidden-tunnel.jpg' },
    { key: 'dialog-box', path: 'assets/ui/dialog_box.png' },
    { key: 'timer', path: 'assets/ui/timer.png' },
    { key: 'button', path: 'assets/ui/button.png' },
    { key: 'button-hover', path: 'assets/ui/button_hover.png' }
  ];

  assets.forEach(({ key, path }) => {
    if (!scene.textures.exists(key)) {
      console.warn(`Asset missing: ${path}, creating placeholder.`);
      scene.add.graphics()
        .fillStyle(0x888888, 1)
        .fillRect(0, 0, 512, 512)
        .generateTexture(key, 512, 512)
        .destroy();
    }
  });
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
      return Object.keys(this.mappings.locations).map((id) => ({
        id,
        path: `assets/scenes/${id}.jpg`
      }));
    }

    return [
      { id: 'prison-cell', path: 'assets/scenes/prison-cell.jpg' },
      { id: 'aztec-village', path: 'assets/scenes/aztec-village.jpg' },
      { id: 'spanish-invasion', path: 'assets/scenes/spanish-invasion.jpg' },
      { id: 'hidden-tunnel', path: 'assets/scenes/hidden-tunnel.jpg' }
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
