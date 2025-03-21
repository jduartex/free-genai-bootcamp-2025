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
  createPlaceholderCircle(scene, 'bed', 0x00ffff);
  createPlaceholderCircle(scene, 'door', 0xff00ff);
  createPlaceholderCircle(scene, 'temple', 0x00ff00);
  createPlaceholderCircle(scene, 'return-arrow', 0xff0000);
  createPlaceholderCircle(scene, 'exit', 0x00ff00);

  // Generate character placeholders
  createPlaceholderCharacter(scene, 'tlaloc', 0x3366ff);
  createPlaceholderCharacter(scene, 'citlali', 0xff6699);
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

function createPlaceholderCharacter(scene: Phaser.Scene, key: string, color: number): void {
  const graphics = scene.add.graphics();
  
  // Body
  graphics.fillStyle(color, 1);
  graphics.fillRect(100, 50, 300, 400);
  
  // Head
  graphics.fillStyle(0xffcc99, 1);
  graphics.fillCircle(250, 100, 50);
  
  // Outline
  graphics.lineStyle(4, 0x000000, 1);
  graphics.strokeRect(100, 50, 300, 400);
  graphics.strokeCircle(250, 100, 50);
  
  // Add name
  const text = scene.add.text(
    250, 250, key,
    { 
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff'
    }
  ).setOrigin(0.5);
  
  // Generate texture
  graphics.generateTexture(key, 500, 500);
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
