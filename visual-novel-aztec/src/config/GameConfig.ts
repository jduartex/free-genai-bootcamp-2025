import Phaser from 'phaser';

export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.NONE, // We'll handle scaling manually
    width: 1280,
    height: 720,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }, // Fixed: Added x property
      debug: false
    }
  },
  render: {
    pixelArt: false,
    antialias: true
  },
  audio: {
    disableWebAudio: false
  },
  fps: {
    target: 60,
    forceSetTimeOut: true
  }
};
