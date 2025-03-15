import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create placeholder files for development when Bedrock isn't available
 */
function createPlaceholders() {
  const directories = [
    'public/assets/ui',
    'public/assets/backgrounds',
    'public/assets/audio/ui',
    'public/assets/audio/dialogue',
    'public/assets/audio/ambience'
  ];
  
  // Create directories if they don't exist
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
  
  // Get a valid silent MP3 file as a buffer
  const silentMp3Buffer = getSilentAudioBuffer();
  
  // Create placeholder audio files with actual audio data
  const audioFiles = {
    'public/assets/audio/ui/click.mp3': silentMp3Buffer,
    'public/assets/audio/ui/hover.mp3': silentMp3Buffer,
    'public/assets/audio/ui/success.mp3': silentMp3Buffer,
    'public/assets/audio/ui/fail.mp3': silentMp3Buffer,
    'public/assets/audio/ui/theme.mp3': silentMp3Buffer,
    'public/assets/audio/ui/test-sound.mp3': silentMp3Buffer,
    'public/assets/audio/ui/unlock.mp3': silentMp3Buffer,
    'public/assets/audio/ui/warning.mp3': silentMp3Buffer,
    'public/assets/audio/ui/pickup.mp3': silentMp3Buffer,
    'public/assets/audio/ambience/prison-ambience.mp3': silentMp3Buffer, 
    'public/assets/audio/ambience/village-ambience.mp3': silentMp3Buffer,
    'public/assets/audio/ambience/battle-ambience.mp3': silentMp3Buffer,
    'public/assets/audio/ambience/tunnel-ambience.mp3': silentMp3Buffer
  };
  
  // Write all audio files
  Object.entries(audioFiles).forEach(([filePath, buffer]) => {
    if (!fs.existsSync(filePath)) {
      // Write the actual audio file data (not an empty file)
      fs.writeFileSync(filePath, buffer);
      console.log(`Created valid audio placeholder: ${filePath}`);
    }
  });
  
  // Copy these files to the correct paths that the game expects
  const ambientFiles = [
    'prison-ambience.mp3',
    'village-ambience.mp3',
    'battle-ambience.mp3',
    'tunnel-ambience.mp3'
  ];
  
  ambientFiles.forEach(file => {
    const sourcePath = path.join('public/assets/audio/ambience', file);
    const destPath = path.join('public/assets/audio', file);
    
    if (fs.existsSync(sourcePath) && !fs.existsSync(destPath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied ambience file to: ${destPath}`);
    }
  });
  
  // Create placeholder image files
  const imageFiles = {
    'public/assets/ui/default_dialog.png': [400, 100],
    'public/assets/ui/default_button.png': [200, 60],
    'public/assets/backgrounds/default.png': [800, 600],
    'public/assets/backgrounds/village.png': [800, 600],
    'public/assets/backgrounds/prison.png': [800, 600],
    'public/assets/backgrounds/temple.png': [800, 600]
  };
  
  for (const [filePath, [width, height]] of Object.entries(imageFiles)) {
    if (!fs.existsSync(filePath)) {
      // Create empty placeholder file
      const content = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#444444"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="24px">
          ${path.basename(filePath)}
        </text>
      </svg>`;
      fs.writeFileSync(filePath, content);
      console.log(`Created placeholder image: ${filePath}`);
    }
  }
}

/**
 * Returns a Buffer containing a minimal valid MP3 file
 * This is a valid 1-second silent MP3 file encoded as a binary buffer
 */
function getSilentAudioBuffer() {
  // This is a base64-encoded silent MP3 file (about 1 second of silence)
  const silentMp3Base64 = "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADQgD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwAQAAAAAAAAAAABSAJAJAQgAAgAAAA0L2YLwxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  
  // Convert from base64 to Buffer
  return Buffer.from(silentMp3Base64, 'base64');
}

// Run the function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createPlaceholders();
}

// Export the function
export { createPlaceholders };
