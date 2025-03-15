import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

/**
 * Create all required placeholder assets for the game
 */
function generateAllPlaceholders() {
  console.log("🎲 Generating all game placeholders...");
  
  // Define structure of required directories and assets
  // IMPORTANT: Assets should be in public folder WITHOUT 'public/' prefix since webpack serves from that dir
  const directories = [
    'public/assets/ui',
    'public/assets/backgrounds',
    'public/assets/audio/ui',
    'public/assets/audio/ambience',
    'public/assets/characters',
    'public/assets/objects'
  ];
  
  // Ensure all required directories exist
  directories.forEach(dir => {
    const fullPath = path.join(projectRoot, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created directory: ${fullPath}`);
    }
  });
  
  // Generate image placeholders with proper dimensions
  // Use relative paths (without "public/") as expected by webpack
  const imagePlaceholders = {
    // UI elements
    'public/assets/ui/button.png': [300, 60, '#555555', 'Button'],
    'public/assets/ui/button-hover.png': [300, 60, '#777777', 'Button Hover'],
    'public/assets/ui/dialog-box.png': [800, 200, '#333333', 'Dialog Box'],
    'public/assets/ui/default_dialog.png': [800, 200, '#333333', 'Default Dialog'],
    'public/assets/ui/default_button.png': [300, 60, '#555555', 'Default Button'],
    
    // Backgrounds
    'public/assets/backgrounds/aztec-village.png': [1024, 576, '#225522', 'Aztec Village'],
    'public/assets/backgrounds/prison-cell.png': [1024, 576, '#332211', 'Prison Cell'],
    'public/assets/backgrounds/temple.png': [1024, 576, '#553322', 'Temple'],
    'public/assets/backgrounds/default.png': [1024, 576, '#444444', 'Default Background'],
    'public/assets/backgrounds/village.png': [1024, 576, '#225522', 'Village'],
    'public/assets/backgrounds/prison.png': [1024, 576, '#332211', 'Prison'],
    
    // Characters
    'public/assets/characters/tlaloc.png': [300, 400, '#2244AA', 'Tlaloc'],
    'public/assets/characters/citlali.png': [300, 400, '#AA4422', 'Citlali'],
    'public/assets/characters/diego.png': [300, 400, '#AA2244', 'Diego'],
    'public/assets/characters/narrator.png': [300, 400, '#333333', 'Narrator'],
    
    // Interactive Objects
    'public/assets/objects/window.png': [200, 200, '#8888FF', 'Window'],
    'public/assets/objects/floor-pattern.png': [300, 150, '#AA8866', 'Floor Pattern'],
    'public/assets/objects/bed.png': [250, 150, '#664422', 'Bed'],
    'public/assets/objects/door.png': [120, 300, '#664422', 'Door'],
    'public/assets/objects/return-arrow.png': [100, 100, '#44AAFF', '←'],
    'public/assets/objects/exit.png': [100, 100, '#44FF44', 'Exit'],
    
    // Logo
    'public/assets/logo.png': [400, 200, '#44AAFF', 'AZTEC ESCAPE']
  };
  
  // Create all image placeholders
  Object.entries(imagePlaceholders).forEach(([filePath, [width, height, color, text]]) => {
    const fullPath = path.join(projectRoot, filePath);
    if (!fs.existsSync(fullPath)) {
      // Use a data URI PNG format instead of SVG for better browser compatibility
      generatePlaceholderPNG(fullPath, width, height, color, text);
      console.log(`🖼️ Created image placeholder: ${filePath}`);
    }
  });
  
  // Create silent audio files (properly formatted for browser decoding)
  const audioFiles = [
    'public/assets/audio/ui/click.mp3',
    'public/assets/audio/ui/hover.mp3',
    'public/assets/audio/ui/success.mp3',
    'public/assets/audio/ui/fail.mp3',
    'public/assets/audio/ui/theme.mp3',
    'public/assets/audio/ui/unlock.mp3',
    'public/assets/audio/ui/warning.mp3',
    'public/assets/audio/ui/pickup.mp3',
    'public/assets/audio/ui/test-sound.mp3',
    'public/assets/audio/ambience/prison-ambience.mp3',
    'public/assets/audio/ambience/village-ambience.mp3',
    'public/assets/audio/ambience/battle-ambience.mp3',
    'public/assets/audio/ambience/tunnel-ambience.mp3'
  ];
  
  // Write proper audio files that won't cause decoding errors
  audioFiles.forEach(filePath => {
    const fullPath = path.join(projectRoot, filePath);
    if (!fs.existsSync(fullPath) || fs.statSync(fullPath).size === 0) {
      // Ensure directory exists
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, SILENT_MP3_BUFFER);
      console.log(`🔊 Created audio placeholder: ${filePath}`);
    }
  });
  
  // Create copies in root assets/audio directory (where some code directly looks)
  const audioCopies = [
    'prison-ambience.mp3', 
    'village-ambience.mp3', 
    'battle-ambience.mp3', 
    'tunnel-ambience.mp3',
    'click.mp3',
    'hover.mp3',
    'success.mp3',
    'fail.mp3',
    'warning.mp3',
    'theme.mp3',
    'unlock.mp3',
    'pickup.mp3'
  ];
  
  // Create the root audio directory if it doesn't exist
  const rootAudioDir = path.join(projectRoot, 'public/assets/audio');
  if (!fs.existsSync(rootAudioDir)) {
    fs.mkdirSync(rootAudioDir, { recursive: true });
  }
  
  audioCopies.forEach(filename => {
    // Determine source directory
    let sourcePath;
    if (['prison-ambience.mp3', 'village-ambience.mp3', 'battle-ambience.mp3', 'tunnel-ambience.mp3'].includes(filename)) {
      sourcePath = path.join(projectRoot, 'public/assets/audio/ambience', filename);
    } else {
      sourcePath = path.join(projectRoot, 'public/assets/audio/ui', filename);
    }
    
    const destPath = path.join(rootAudioDir, filename);
    
    if (fs.existsSync(sourcePath) && (!fs.existsSync(destPath) || fs.statSync(destPath).size === 0)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`📋 Copied ${filename} to root audio directory`);
    }
  });

  console.log("✅ All placeholders created successfully!");
  return true;
}

/**
 * Generate a PNG placeholder image and save it to a file
 * This method uses a simple rectangle with text rendered to a data URI
 */
function generatePlaceholderPNG(filePath, width, height, bgColor, text) {
  try {
    // Create a canvas to generate the PNG
    const { createCanvas } = require('canvas');
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    // Add border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, width-4, height-4);
    
    // Add text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width/2, height/2);
    
    // Save as PNG file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filePath, buffer);
  } catch (err) {
    console.error(`Error generating PNG: ${err.message}`);
    // Fallback to SVG if canvas module isn't available
    generatePlaceholderSVG(filePath, width, height, bgColor, text);
  }
}

/**
 * Generate an SVG placeholder as fallback
 */
function generatePlaceholderSVG(filePath, width, height, bgColor, text) {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${bgColor}"/>
    <rect width="100%" height="100%" fill="none" stroke="#FFFFFF" stroke-width="4"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="24px" font-family="Arial, sans-serif">
      ${text}
    </text>
  </svg>`;
  
  fs.writeFileSync(filePath, svg);
}

// This is a valid minimal MP3 file (1 second of silence)
// It's specifically crafted to be decodable by all browsers
const SILENT_MP3_BUFFER = Buffer.from(
  "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADQgD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwAQAAAAAAAAAAABSAJAJAQgAAgAAAA0L2YLwxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "base64"
);

// Run the generator function immediately
generateAllPlaceholders();

export { generateAllPlaceholders };
