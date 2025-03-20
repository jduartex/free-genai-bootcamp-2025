import Phaser from 'phaser';
import fs from 'fs';
import path from 'path';

/**
 * Utility to generate placeholder assets for development
 */
export class PlaceholderGenerator {
  /**
   * Generate placeholder images for missing assets
   * @param baseDir The base public directory
   */
  static generatePlaceholders(baseDir: string): void {
    console.log('Generating placeholder assets...');
    
    const scenes = [
      'prison-cell', 
      'aztec-village', 
      'spanish-invasion', 
      'hidden-tunnel'
    ];
    
    const characters = [
      'tlaloc', 
      'citlali', 
      'diego', 
      'narrator'
    ];
    
    const ui = [
      'dialog-box', 
      'timer', 
      'button', 
      'button-hover', 
      'inventory-icon', 
      'help-icon'
    ];
    
    const objects = [
      'window', 
      'floor-pattern', 
      'bed', 
      'door', 
      'temple', 
      'return-arrow', 
      'exit'
    ];
    
    // Generate scene placeholders
    scenes.forEach(scene => {
      this.generatePlaceholderImage(
        path.join(baseDir, 'assets', 'scenes', `${scene}.jpg`),
        800, 600, `Scene: ${scene}`, '#444466'
      );
    });
    
    // Generate character placeholders
    characters.forEach(character => {
      this.generatePlaceholderImage(
        path.join(baseDir, 'assets', 'characters', `${character}.png`),
        300, 500, `Character: ${character}`, '#664444'
      );
    });
    
    // Generate UI placeholders
    ui.forEach(element => {
      this.generatePlaceholderImage(
        path.join(baseDir, 'assets', 'ui', `${element}.png`),
        200, 100, `UI: ${element}`, '#446644'
      );
    });
    
    // Generate object placeholders
    objects.forEach(object => {
      this.generatePlaceholderImage(
        path.join(baseDir, 'assets', 'objects', `${object}.png`),
        100, 100, `Object: ${object}`, '#444444'
      );
    });
    
    // Generate empty audio files
    this.generateEmptyAudioFiles(baseDir);
    
    console.log('Placeholder generation complete!');
  }

  /**
   * Generate an HTML5 canvas-based placeholder image and save it
   */
  private static generatePlaceholderImage(
    filePath: string, 
    width: number, 
    height: number, 
    text: string,
    bgColor: string = '#333333'
  ): void {
    // This would typically use node-canvas in Node.js
    // For browser use, we'd need to create placeholders another way
    console.log(`Would generate placeholder: ${filePath}`);
    // In production, would actually create the file here
  }

  /**
   * Generate empty audio files
   */
  private static generateEmptyAudioFiles(baseDir: string): void {
    const audioFiles = [
      'prison_ambience.mp3',
      'village_ambience.mp3',
      'battle_ambience.mp3',
      'tunnel_ambience.mp3',
      'click.mp3',
      'hover.mp3',
      'success.mp3',
      'fail.mp3',
      'pickup.mp3',
      'theme.mp3'
    ];
    
    audioFiles.forEach(file => {
      console.log(`Would generate audio placeholder: ${path.join(baseDir, 'assets', 'audio', file)}`);
      // In production, would create a silent MP3 here
    });
  }
}

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
