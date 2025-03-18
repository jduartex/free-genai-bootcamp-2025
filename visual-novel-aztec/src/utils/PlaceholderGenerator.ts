import Phaser from 'phaser';

export function generatePlaceholders(scene: Phaser.Scene): void {
  // Generate placeholder backgrounds
  createPlaceholderBackground(scene, 'prison-cell', 0x333344);
  createPlaceholderBackground(scene, 'aztec-village', 0x446644);
  createPlaceholderBackground(scene, 'spanish-invasion', 0x664444);
  createPlaceholderBackground(scene, 'hidden-tunnel', 0x222222);

  // Generate placeholder UI elements
  createPlaceholderUI(scene, 'dialog-box', 0x222222, 800, 200);
  createPlaceholderUI(scene, 'timer', 0x222266, 160, 60);
  createPlaceholderUI(scene, 'button', 0x444444, 300, 60);
  createPlaceholderUI(scene, 'button-hover', 0x555555, 300, 60);

  // Generate interactive elements
  createPlaceholderCircle(scene, 'window', 0xffff00);
  createPlaceholderCircle(scene, 'floor-pattern', 0xffaa00);
}

function createPlaceholderBackground(scene: Phaser.Scene, key: string, color: number): void {
  const graphics = scene.add.graphics();
  graphics.fillStyle(color, 1);
  graphics.fillRect(0, 0, 1280, 720);
  graphics.lineStyle(4, 0xffffff, 1);
  graphics.strokeRect(2, 2, 1276, 716);
  
  // Add text label
  const text = scene.add.text(
    640, 360, key,
    { 
      fontFamily: 'Arial',
      fontSize: '48px',
      color: '#ffffff'
    }
  ).setOrigin(0.5);
  
  // Generate texture
  graphics.generateTexture(key, 1280, 720);
  graphics.destroy();
  text.destroy();
}

function createPlaceholderUI(scene: Phaser.Scene, key: string, color: number, width: number, height: number): void {
  const graphics = scene.add.graphics();
  graphics.fillStyle(color, 1);
  graphics.fillRoundedRect(0, 0, width, height, 10);
  graphics.lineStyle(2, 0xffffff, 1);
  graphics.strokeRoundedRect(0, 0, width, height, 10);
  
  // Generate texture
  graphics.generateTexture(key, width, height);
  graphics.destroy();
}

function createPlaceholderCircle(scene: Phaser.Scene, key: string, color: number): void {
  const graphics = scene.add.graphics();
  graphics.fillStyle(color, 0.8);
  graphics.fillCircle(32, 32, 32);
  graphics.lineStyle(2, 0x000000, 1);
  graphics.strokeCircle(32, 32, 32);
  
  // Generate texture
  graphics.generateTexture(key, 64, 64);
  graphics.destroy();
}
