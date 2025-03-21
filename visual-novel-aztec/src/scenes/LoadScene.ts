import Phaser from 'phaser';
import { loadStoryData } from '../utils/StoryLoader';
import { generatePlaceholders } from '../utils/PlaceholderGenerator';
import { SoundManager } from '../utils/SoundManager';

export class LoadScene extends Phaser.Scene {
  private progressBar!: HTMLElement;
  private loadingText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'LoadScene' });
  }

  preload(): void {
    // Get DOM elements
    this.progressBar = document.getElementById('progress') as HTMLElement;
    
    // Create loading text
    this.loadingText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 50,
      'Loading... 0%',
      {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // Update progress bar during load
    this.load.on('progress', (value: number) => {
      if (this.progressBar) {
        this.progressBar.style.width = `${Math.floor(value * 100)}%`;
      }
      this.loadingText.setText(`Loading... ${Math.floor(value * 100)}%`);
    });
    
    // Hide loading screen when complete
    this.load.on('complete', () => {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.style.display = 'none';
      }
    });

    // Pre-create placeholder sounds to avoid errors
    this.createEmptySounds();
    
    // Generate placeholder assets first
    generatePlaceholders(this);
    
    // Then try to load actual assets (will use placeholders if not found)
    this.loadAssets();
  }

  create(): void {
    // Initialize the sound manager
    SoundManager.init(this);
    
    // Generate placeholder assets
    generatePlaceholders(this);
    
    // Load story data
    loadStoryData()
      .then(() => {
        // Start the game
        this.scene.start('MenuScene');
      })
      .catch((error: Error) => {
        console.error('Failed to load story data:', error);
        
        // Create dummy story data
        console.log('Creating dummy story data...');
        this.createDummyStoryData();
        
        // Start menu anyway
        this.scene.start('MenuScene');
      });
  }

  private createDummyStoryData(): void {
    // This function adds minimal story data to the StoryStore
    // so the game can run even without proper JSON files
    const { StoryStore } = require('../utils/StoryLoader');
    
    // Add mappings
    StoryStore.mappings = {
      characterNames: {
        "tlaloc": "Tlaloc",
        "citlali": "Citlali",
        "diego": "Guard Diego",
        "narrator": "Narrator"
      },
      locations: {
        "prison-cell": "Spanish Prison Cell",
        "aztec-village": "Aztec Village (Flashback)",
        "spanish-invasion": "Spanish Invasion (Flashback)",
        "hidden-tunnel": "Escape Tunnel"
      }
    };
    
    // Add a simple scene
    const dummyScene = {
      id: "scene001",
      title: "Prison Escape",
      location_id: "prison-cell",
      startsAt: "x00",
      timer: { initial: 3600, penalty: 300 },
      dialog: {
        "x00": {
          speakerId: "narrator",
          japanese: "テスト",
          english: "Test",
          default_next_id: "001"
        },
        "001": {
          speakerId: "tlaloc",
          japanese: "脱出しましょう！",
          english: "Let's escape!",
          default_next_id: "002"
        },
        "002": {
          speakerId: "citlali",
          japanese: "はい、急ぎましょう。",
          english: "Yes, let's hurry.",
          default_next_id: "001"
        }
      }
    };
    
    StoryStore.scenes.set("scene001", dummyScene);
  }

  private loadAssets(): void {
    // Try to load background images - these will fail gracefully
    // since we've already created placeholder textures
    this.load.image('prison-cell', 'assets/scenes/prison_cell.jpg');
    this.load.image('aztec-village', 'assets/scenes/aztec_village.jpg');
    this.load.image('spanish-invasion', 'assets/scenes/spanish_invasion.jpg');
    this.load.image('hidden-tunnel', 'assets/scenes/hidden_tunnel.jpg');
    
    // Load character images
    this.load.image('tlaloc', 'assets/characters/tlaloc.png');
    this.load.image('citlali', 'assets/characters/citlali.png');
    
    // Load UI elements
    this.load.image('dialog-box', 'assets/ui/dialog_box.png');
    this.load.image('timer', 'assets/ui/timer.png');
    this.load.image('button', 'assets/ui/button.png');
    this.load.image('button-hover', 'assets/ui/button_hover.png');
    
    // Note: Spine animations disabled until plugin is properly configured
    // Will use static images instead
  }

  private createEmptySounds(): void {
    // List of required sounds
    const requiredSounds = [
      'theme', 'prison-ambience', 'click', 'hover', 'success', 'fail', 
      'warning', 'pickup', 'village-ambience', 'battle-ambience', 'tunnel-ambience'
    ];
    
    // Check if each sound exists, if not register a dummy sound
    requiredSounds.forEach(key => {
      if (!this.sound.get(key)) {
        try {
          // Create a silent sound
          const sound = this.sound.add(key, { volume: 0 });
          
          // We need to override the play method to prevent errors,
          // but we need to ensure it returns a boolean as expected by TypeScript
          const originalPlay = sound.play;
          (sound as any).play = function(this: Phaser.Sound.BaseSound, markerName?: string, config?: Phaser.Types.Sound.SoundConfig): boolean {
            console.log(`Placeholder sound played: ${key}`);
            try {
              // We still want to call the original but with error handling
              return !!originalPlay.call(this, markerName, config);
            } catch (e) {
              // If there's an error, just pretend it worked
              console.warn(`Error playing sound ${key}:`, e);
              return true;
            }
          };
        } catch (e) {
          console.warn(`Failed to create placeholder sound: ${key}`, e);
        }
      }
    });
    
    console.log('Placeholder sounds setup complete');
  }
}
