import Phaser from 'phaser';
// Import all scenes
import { LoadScene } from './scenes/LoadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { DialogueScene } from './scenes/DialogueScene';
import { UIScene } from './scenes/UIScene';
import { SettingsScene } from './scenes/SettingsScene';
import { PracticeScene } from './scenes/PracticeScene';
import { CreditsScene } from './scenes/CreditsScene';
import { PreloadScene } from './scenes/PreloadScene';
import { setupGlobalErrorHandlers } from './utils/ErrorHandler';
import { SoundManager } from './utils/SoundManager';

// Initialize global error handlers
setupGlobalErrorHandlers();

console.log('🚨🚨🚨 INITIALIZING GAME WITH MENUSCENE ONLY 🚨🚨🚨');

// Game configuration - USING ONLY MENUSCENE
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  // SIMPLIFIED SCENES ARRAY - ONLY INCLUDE WHAT'S NEEDED FOR BASIC MENU
  scene: [MenuScene, GameScene, SettingsScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  // Fix the audio configuration type
  audio: {
    disableWebAudio: false,
    noAudio: false
    // Remove the context property that's causing the type error
    // Remove disableContextMenu property that might not be in the type definition
  },
  dom: {
    createContainer: true
  },
  render: {
    pixelArt: false,
    antialias: true
  }
};

window.addEventListener('load', () => {
  try {
    console.log('🚨🚨🚨 CREATING GAME WITH SIMPLIFIED CONFIG 🚨🚨🚨');
    
    // Create the game with error handling
    const game = new Phaser.Game(config);
    
    // Add the sound global unlock option (important for mobile browsers)
    game.sound.once('unlocked', () => {
      console.log('🔊 Audio system unlocked and ready!');
    });
    
    // Initialize SoundManager after game is ready
    game.events.once('ready', () => {
      console.log('🚨🚨🚨 GAME READY - ACTIVE SCENES: 🚨🚨🚨');
      game.scene.scenes.forEach(scene => {
        console.log(`Active scene: ${scene.scene.key}`);
      });
      
      // Initialize SoundManager with MenuScene
      const menuScene = game.scene.getScene('MenuScene');
      if (menuScene) {
        SoundManager.getInstance().init(menuScene);
        console.log('SoundManager initialized with MenuScene');
      }
      
      // Add other scenes only after menu is working
      game.scene.add('DialogueScene', DialogueScene);
      game.scene.add('UIScene', UIScene);
      game.scene.add('PracticeScene', PracticeScene);
      game.scene.add('CreditsScene', CreditsScene);
      // game.scene.add('LoadScene', LoadScene);
      // game.scene.add('PreloadScene', PreloadScene);
    });
    
    // Emergency function to force menu visibility
    (window as any).forceMenuScene = function() {
      game.scene.start('MenuScene');
      console.log('Forced MenuScene to start');
    };
    
  } catch (error) {
    console.error('Failed to initialize game:', error);
    
    // Show a user-friendly error message
    const errorElement = document.createElement('div');
    errorElement.style.cssText = 
      'position:fixed;top:0;left:0;right:0;bottom:0;background:#300;color:#fff;' +
      'display:flex;align-items:center;justify-content:center;flex-direction:column;font-family:Arial;';
    errorElement.innerHTML = 
      '<h1>Game Initialization Error</h1>' +
      '<p>Sorry, the game failed to start. Please try refreshing the page.</p>' +
      '<button onclick="window.location.reload()" style="padding:10px 20px;margin-top:20px;cursor:pointer;">Reload</button>';
    document.body.appendChild(errorElement);
  }
});

console.log('🚨🚨🚨 MAIN.TS EXECUTION COMPLETED 🚨🚨🚨');
