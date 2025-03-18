import Phaser from 'phaser';
import WebFontLoader from 'webfontloader';
import { GameConfig } from './config/GameConfig';
import { PreloadScene } from './scenes/PreloadScene';
import { LoadScene } from './scenes/LoadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { DialogueScene } from './scenes/DialogueScene';
import { SettingsScene } from './scenes/SettingsScene';
import { UIScene } from './scenes/UIScene';
import { CreditsScene } from './scenes/CreditsScene';
import { SoundManager } from './utils/SoundManager';

// Global type declarations
declare global {
  interface Window {
    game: Phaser.Game;
    SoundManager: any;
  }
}

// Load web fonts
WebFontLoader.load({
  google: {
    families: ['Crimson Text:400,700', 'Noto Sans JP:400,700']
  },
  active: startGame,
  inactive: startGame,
  timeout: 3000
});

// Create game instance once fonts are loaded
function startGame() {
  // Enable Phaser debugging in development mode
  if (process.env.NODE_ENV === 'development') {
    (window as any).Phaser = Phaser;
  }
  
  // Initialize the game
  const game = new Phaser.Game(GameConfig);
  
  // Add all scenes
  game.scene.add('PreloadScene', PreloadScene);
  game.scene.add('LoadScene', LoadScene);
  game.scene.add('MenuScene', MenuScene);
  game.scene.add('GameScene', GameScene);
  game.scene.add('DialogueScene', DialogueScene);
  game.scene.add('SettingsScene', SettingsScene);
  game.scene.add('UIScene', UIScene);
  game.scene.add('CreditsScene', CreditsScene);
  
  // Start with the preload scene
  game.scene.start('PreloadScene');
  
  // Store game instance in window for debugging
  if (typeof window !== 'undefined') {
    window.game = game;
  }
  
  // Make SoundManager available globally
  if (typeof window !== 'undefined') {
    window.SoundManager = SoundManager;
  }
  
  // Add event listener for audio unlock button
  document.getElementById('audio-unlock-button')?.addEventListener('click', () => {
    game.events.emit('audioUnlocked');
  });
}
