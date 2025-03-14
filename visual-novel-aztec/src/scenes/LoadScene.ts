import Phaser from 'phaser';
import { loadStoryData } from '../utils/StoryLoader';

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
        fontFamily: 'Noto Sans JP',
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

    // Load game assets
    this.loadAssets();
  }

  create(): void {
    // Load story data
    loadStoryData().then(() => {
      // Start the game
      this.scene.start('MenuScene');
    }).catch(error => {
      console.error('Failed to load story data:', error);
      // Show error message
      this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        'Error loading game data. Please refresh the page.',
        {
          fontSize: '24px',
          fontFamily: 'Noto Sans JP',
          color: '#ff0000',
          align: 'center',
          wordWrap: { width: this.cameras.main.width - 100 }
        }
      ).setOrigin(0.5);
    });
  }

  private loadAssets(): void {
    // Load background images
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
    
    // Load audio
    this.load.audio('theme', 'assets/audio/theme.mp3');
    this.load.audio('prison-ambience', 'assets/audio/prison_ambience.mp3');
    this.load.audio('click', 'assets/audio/click.mp3');
    
    // Load spine animations if available
    try {
      this.load.spine('tlaloc-spine', 'assets/spine/tlaloc.json', ['assets/spine/tlaloc.atlas'], true);
      this.load.spine('citlali-spine', 'assets/spine/citlali.json', ['assets/spine/citlali.atlas'], true);
    } catch (e) {
      console.warn('Spine plugin not available or spine assets missing, using static images instead');
    }
  }
}
