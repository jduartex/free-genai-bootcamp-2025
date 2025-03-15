import { generatePlaceholders } from '../src/utils/PlaceholderGenerator.js';
import fs from 'fs';
import path from 'path';

async function generateUIPlaceholders(): Promise<void> {
  console.log('Generating UI placeholders...');
  
  const publicDir = path.resolve(process.cwd(), 'public');
  const uiDir = path.resolve(publicDir, 'assets/ui');
  const audioDir = path.resolve(publicDir, 'assets/audio');
  
  // Create directories if they don't exist
  fs.mkdirSync(uiDir, { recursive: true });
  fs.mkdirSync(audioDir, { recursive: true });
  
  // Generate UI placeholders
  generateUIElement('dialog-box', 800, 200, 0x222222);
  generateUIElement('timer', 160, 60, 0x222266);
  generateUIElement('button', 300, 60, 0x444444); 
  generateUIElement('button-hover', 300, 60, 0x555555);
  generateUIElement('return-arrow', 64, 64, 0xff0000);
  
  // Generate empty audio files
  const audioFiles = [
    'click', 'hover', 'success', 'fail', 'warning', 'pickup',
    'theme', 'prison-ambience', 'village-ambience', 'battle-ambience', 'tunnel-ambience'
  ];
  
  for (const file of audioFiles) {
    const filePath = path.join(audioDir, `${file}.mp3`);
    if (!fs.existsSync(filePath)) {
      // Create an empty file
      fs.writeFileSync(filePath, '');
      console.log(`Created empty audio placeholder: ${file}.mp3`);
    }
  }
  
  console.log('UI and audio placeholders generated!');
}

function generateUIElement(name: string, width: number, height: number, color: number): void {
  // Generate a text representation of what the UI element would look like
  const uiDir = path.resolve(process.cwd(), 'public/assets/ui');
  const filePath = path.join(uiDir, `${name}.png`);
  
  if (!fs.existsSync(filePath)) {
    const htmlContent = `
      <html>
        <head>
          <style>
            body { 
              margin: 0; 
              width: ${width}px; 
              height: ${height}px; 
              background-color: #${color.toString(16).padStart(6, '0')};
              color: white;
              display: flex;
              justify-content: center;
              align-items: center;
              font-family: sans-serif;
              border: 2px solid white;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>${name}</body>
      </html>
    `;
    
    // Write placeholder file and HTML for reference
    fs.writeFileSync(filePath, `Placeholder for ${name}`);
    fs.writeFileSync(filePath.replace('.png', '.html'), htmlContent);
    console.log(`Created UI placeholder: ${name}.png`);
  }
}

// Run the generator
generateUIPlaceholders();
