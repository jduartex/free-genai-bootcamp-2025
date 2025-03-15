import Phaser from 'phaser';
import WebFontLoader from 'webfontloader';
import { GameConfig } from './config/GameConfig';
import { PreloadScene } from './scenes/PreloadScene';
import { LoadScene } from './scenes/LoadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { DialogueScene } from './scenes/DialogueScene';
import { CreditsScene } from './scenes/CreditsScene';
import { SettingsScene } from './scenes/SettingsScene';
import { SoundManager } from './utils/SoundManager';

// Note: To properly use Spine animations, we would need to set up the Spine plugin
// For now, we're using static images instead
// This will be added in a future update when we have proper Spine assets

// Load required fonts
WebFontLoader.load({
  google: {
    families: ['Noto Sans JP:400,700', 'Crimson Text:400,700']
  },
  active: () => {
    // Initialize the game when fonts are loaded
    startGame();
  },
  inactive: () => {
    // Fallback to start the game if fonts fail to load
    console.warn('WebFont loading failed. Starting game with fallback fonts.');
    startGame();
  }
});

function startGame(): void {
  // Create the game instance with configuration
  const game = new Phaser.Game({
    ...GameConfig,
    scene: [
      PreloadScene,  // Start with PreloadScene for audio initialization
      LoadScene, 
      MenuScene, 
      GameScene,
      DialogueScene,
      UIScene,
      CreditsScene,
      SettingsScene
    ]
  });
  
  // Make game available globally for audio unlock
  (window as any).game = game;

  // Handle window resize
  const resize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scale = Math.min(width / 1280, height / 720);
    
    game.scale.resize(1280, 720);
    game.scale.setZoom(scale);
  };

  window.addEventListener('resize', resize);
  resize();
  
  // Make SoundManager available globally
  (window as any).SoundManager = SoundManager;
}
