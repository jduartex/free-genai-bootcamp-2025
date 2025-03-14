import Phaser from 'phaser';
import WebFontLoader from 'webfontloader';
import { GameConfig } from './config/GameConfig';
import { LoadScene } from './scenes/LoadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { DialogueScene } from './scenes/DialogueScene';

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
      LoadScene, 
      MenuScene, 
      GameScene,
      DialogueScene,
      UIScene
    ]
  });

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
}
