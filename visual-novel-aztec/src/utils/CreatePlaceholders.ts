import fs from 'fs';
import path from 'path';

/**
 * Create placeholder files for development when Bedrock isn't available
 */
export function createPlaceholders(): void {
  const directories = [
    'public/assets/ui',
    'public/assets/backgrounds',
    'public/assets/audio/ui',
    'public/assets/audio/dialogue'
  ];
  
  // Create directories if they don't exist
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
  
  // Create placeholder audio files
  const audioFiles = [
    'click.mp3', 
    'hover.mp3', 
    'success.mp3', 
    'fail.mp3', 
    'theme.mp3', 
    'test-sound.mp3'
  ];
  
  audioFiles.forEach(file => {
    const filePath = path.join('public/assets/audio/ui', file);
    if (!fs.existsSync(filePath)) {
      // Create an empty file - we'll handle missing audio gracefully in the game
      fs.writeFileSync(filePath, '');
      console.log(`Created placeholder audio: ${filePath}`);
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

// Run the function if this file is executed directly
if (require.main === module) {
  createPlaceholders();
}
