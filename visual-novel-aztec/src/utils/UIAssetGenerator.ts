import Phaser from 'phaser';

/**
 * Generates UI assets like buttons at runtime if they're missing
 */
export function generateUIAssets(scene: Phaser.Scene): void {
  // Create UI buttons
  generateButton(scene, 'button', 0x333333, 0xffffff);
  generateButton(scene, 'button-hover', 0x444488, 0xffffff);
  generateButton(scene, 'dialog-box', 0x222222, 0xffffff, 0.8);
  
  // Generate other UI elements as needed
  console.log('Generated UI assets for runtime use');
}

/**
 * Generate a button texture
 */
function generateButton(
  scene: Phaser.Scene, 
  key: string, 
  fillColor: number,
  strokeColor: number, 
  alpha: number = 1.0,
  width: number = 300,
  height: number = 60
): void {
  // Skip if texture already exists
  if (scene.textures.exists(key)) {
    return;
  }
  
  // Create graphics for the button
  const graphics = scene.add.graphics();
  
  // Fill with background color
  graphics.fillStyle(fillColor, alpha);
  graphics.fillRoundedRect(0, 0, width, height, 12);
  
  // Add a border
  graphics.lineStyle(2, strokeColor, 1);
  graphics.strokeRoundedRect(0, 0, width, height, 12);
  
  // Add a subtle gradient effect
  graphics.fillGradientStyle(
    fillColor, 
    fillColor, 
    lightenColor(fillColor, 20), 
    lightenColor(fillColor, 20),
    alpha
  );
  graphics.fillRoundedRect(4, 4, width - 8, height - 8, 10);
  
  // Generate the texture
  graphics.generateTexture(key, width, height);
  graphics.destroy();
  
  console.log(`Generated button texture: ${key}`);
}

/**
 * Lighten a hex color by a specified amount
 */
function lightenColor(color: number, amount: number): number {
  // Extract RGB components
  const r = Math.min(255, ((color >> 16) & 0xFF) + amount);
  const g = Math.min(255, ((color >> 8) & 0xFF) + amount);
  const b = Math.min(255, (color & 0xFF) + amount);
  
  // Recombine into a new color
  return (r << 16) | (g << 8) | b;
}
