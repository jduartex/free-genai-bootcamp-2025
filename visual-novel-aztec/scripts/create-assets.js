import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Setup dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the base directories
const baseDir = path.resolve(__dirname, '../public/assets');

// Ensure directories exist
const directories = ['scenes', 'characters', 'ui', 'objects', 'audio'];
directories.forEach(dir => {
  const dirPath = path.join(baseDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Define asset requirements
const assets = {
  scenes: [
    { name: 'prison-cell.png', description: 'A dark prison cell with stone walls, a small window, and minimal furnishings' },
    { name: 'aztec-village.png', description: 'An ancient Aztec village with pyramids and traditional architecture' },
    { name: 'spanish-invasion.png', description: 'Spanish conquistadors invading an Aztec settlement' },
    { name: 'hidden-tunnel.png', description: 'A dimly lit underground tunnel with Aztec carvings on the walls' }
  ],
  characters: [
    { name: 'tlaloc.png', description: 'An Aztec man in traditional clothing, appears strong and determined' },
    { name: 'citlali.png', description: 'An Aztec woman with decorative clothing, appears intelligent and resourceful' },
    { name: 'diego.png', description: 'A Spanish guard in armor with a stern expression' },
    { name: 'narrator.png', description: 'A neutral icon representing the narrator (could be a scroll or book)' }
  ],
  ui: [
    { name: 'dialog-box.png', description: 'A semi-transparent dark box with decorative Aztec-style border' },
    { name: 'button.png', description: 'A stone-like button with Aztec patterns' },
    { name: 'button-hover.png', description: 'The same button but with a subtle glow effect' },
    { name: 'timer.png', description: 'A circular or hourglass-shaped timer with Aztec styling' },
    { name: 'inventory-icon.png', description: 'A bag or pouch icon' },
    { name: 'help-icon.png', description: 'A question mark with Aztec styling' }
  ],
  objects: [
    { name: 'window.png', description: 'A small barred prison window' },
    { name: 'floor-pattern.png', description: 'An Aztec pattern carved into a stone floor' },
    { name: 'bed.png', description: 'A simple prison bed made of wood' },
    { name: 'door.png', description: 'A heavy wooden prison door with metal reinforcements' },
    { name: 'temple.png', description: 'An Aztec pyramid temple' },
    { name: 'return-arrow.png', description: 'An arrow indicating return direction' },
    { name: 'exit.png', description: 'A doorway or opening indicating an exit' }
  ],
  audio: [
    { name: 'click.mp3', description: 'A short click sound for UI interactions' },
    { name: 'theme.mp3', description: 'Aztec-themed background music, mysterious and atmospheric' },
    { name: 'prison-ambience.mp3', description: 'Ambient sound of a prison (chains, distant sounds)' },
    { name: 'village-ambience.mp3', description: 'Ambient sound of a village (people, animals)' },
    { name: 'battle-ambience.mp3', description: 'Sounds of battle (weapons, shouting)' },
    { name: 'tunnel-ambience.mp3', description: 'Echoing, dripping water sounds in a tunnel' }
  ]
};

// Generate report
let report = "# Asset Creation Guide for Aztec Escape\n\n";

Object.entries(assets).forEach(([category, items]) => {
  report += `## ${category.toUpperCase()}\n\n`;
  
  items.forEach(item => {
    const filePath = path.join(baseDir, category, item.name);
    const exists = fs.existsSync(filePath);
    
    report += `### ${item.name}\n`;
    report += `**Description:** ${item.description}\n`;
    report += `**Status:** ${exists ? '✅ Already exists' : '❌ Needs creation'}\n`;
    report += `**Path:** \`${filePath}\`\n\n`;
  });
});

// Save the report
const reportPath = path.resolve(__dirname, '../asset-creation-guide.md');
fs.writeFileSync(reportPath, report);

console.log(`Asset creation guide generated at: ${reportPath}`);
