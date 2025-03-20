const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create output path
const faviconPath = path.resolve(__dirname, '../public/favicon.ico');

// Generate a simple favicon
function createFavicon() {
  // Create a canvas
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  
  // Fill background with Aztec blue-green color
  ctx.fillStyle = '#1E7B78';
  ctx.fillRect(0, 0, 32, 32);
  
  // Draw a simple Aztec-inspired pattern
  ctx.strokeStyle = '#FFD700'; // Gold color
  ctx.lineWidth = 2;
  
  // Pyramid shape
  ctx.beginPath();
  ctx.moveTo(16, 4);
  ctx.lineTo(28, 26);
  ctx.lineTo(4, 26);
  ctx.closePath();
  ctx.stroke();
  
  // Steps in the pyramid
  ctx.beginPath();
  ctx.moveTo(8, 20);
  ctx.lineTo(24, 20);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(10, 16);
  ctx.lineTo(22, 16);
  ctx.stroke();
  
  // Save as PNG first (we'd convert to ICO with a proper library in production)
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(faviconPath.replace('.ico', '.png'), buffer);
  
  console.log(`Favicon created at: ${faviconPath.replace('.ico', '.png')}`);
  console.log('Note: For a proper .ico file, convert the PNG using a tool like ImageMagick');
}

try {
  createFavicon();
} catch (error) {
  console.error('Error creating favicon:', error);
}
