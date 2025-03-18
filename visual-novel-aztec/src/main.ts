import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { DialogueScene } from './scenes/DialogueScene';
import { UIScene } from './scenes/UIScene';
import { SettingsScene } from './scenes/SettingsScene';
import { PracticeScene } from './scenes/PracticeScene';
import { setupGlobalErrorHandlers } from './utils/ErrorHandler';
import { SoundManager } from './utils/SoundManager';

// Initialize global error handlers
setupGlobalErrorHandlers();

const config: Phaser.Types.Core.GameConfig = {
  // ...existing config...
};

window.addEventListener('load', () => {
  try {
    // Create the game with error handling
    const game = new Phaser.Game(config);
    
    // Initialize sound manager after game creation
    game.events.once('ready', () => {
      // Initialize SoundManager with the first scene that gets created
      const firstScene = game.scene.getScene('BootScene') || 
                         game.scene.getScene('PreloadScene') ||
                         game.scene.getScene('MenuScene');
                         
      if (firstScene) {
        SoundManager.getInstance().init(firstScene);
        console.log('SoundManager initialized with first scene');
      }
    });
    
  } catch (error) {
    console.error('Failed to initialize game:', error);
    
    // Show a user-friendly error message
    const errorElement = document.createElement('div');
    errorElement.style.cssText = 
      'position:fixed;top:0;left:0;right:0;bottom:0;background:#300;color:#fff;' +
      'display:flex;align-items:center;justify-content:center;flex-direction:column;font-family:Arial;';
    errorElement.innerHTML = 
      '<h1>Game Initialization Error</h1>' +
      '<p>Sorry, the game failed to start. Please try refreshing the page.</p>';
    document.body.appendChild(errorElement);
  }
});
