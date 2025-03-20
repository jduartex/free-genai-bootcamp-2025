import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the base directories
const baseDir = path.resolve(__dirname, '../public/assets');

// Define expected asset files based on our requirements
const expectedAssets = {
  scenes: [
    'prison-cell.png',
    'aztec-village.png',
    'spanish-invasion.png',
    'hidden-tunnel.png'
  ],
  characters: [
    'tlaloc.png',
    'citlali.png',
    'guard.png'    
  ],
  ui: [
    'dialog-box.png',
    'button.png',
    'button-hover.png',
    'timer.png',
    'inventory-icon.png',
    'help-icon.png'
  ],
  objects: [
    'window.png',
    'floor-pattern.png',
    'bed.png',
    'door.png',
    'temple.png',
    'return-arrow.png',
    'exit.png'
  ],
  audio: [
    'click.wav',
    'theme.mp3',
    'prison-ambience.mp3',
    'village-ambience.mp3',
    'battle-ambience.mp3',
    'tunnel-ambience.mp3'
  ]
};

// Check if directories exist
const checkDirectories = () => {
  console.log("\n=== DIRECTORY CHECK ===");
  const directories = ['scenes', 'characters', 'ui', 'objects', 'audio', 'audio/dialogue'];
  let allDirsExist = true;
  
  directories.forEach(dir => {
    const dirPath = path.join(baseDir, dir);
    const exists = fs.existsSync(dirPath);
    console.log(`${exists ? '✅' : '❌'} Directory: ${dirPath}`);
    if (!exists) allDirsExist = false;
  });
  
  return allDirsExist;
};

// Check if expected assets exist
const checkAssets = () => {
  console.log("\n=== ASSET CHECK ===");
  let allAssetsExist = true;
  let totalFound = 0;
  let totalExpected = 0;
  
  Object.entries(expectedAssets).forEach(([category, files]) => {
    console.log(`\n--- ${category.toUpperCase()} ---`);
    totalExpected += files.length;
    
    files.forEach(file => {
      const filePath = path.join(baseDir, category, file);
      const exists = fs.existsSync(filePath);
      console.log(`${exists ? '✅' : '❌'} ${file}`);
      if (exists) totalFound++;
      else allAssetsExist = false;
    });
  });
  
  console.log(`\nFound ${totalFound}/${totalExpected} expected assets`);
  return allAssetsExist;
};

// Check if favicon exists
const checkFavicon = () => {
  console.log("\n=== FAVICON CHECK ===");
  const faviconPath = path.resolve(__dirname, '../public/favicon.ico');
  const pngPath = path.resolve(__dirname, '../public/favicon.png');
  const faviconExists = fs.existsSync(faviconPath);
  const pngExists = fs.existsSync(pngPath);
  
  console.log(`${faviconExists ? '✅' : '❌'} favicon.ico`);
  console.log(`${pngExists ? '✅' : '❓'} favicon.png (alternative)`);
  
  return faviconExists || pngExists;
};

// Run the checks
const dirsExist = checkDirectories();
const assetsExist = checkAssets();
const faviconExists = checkFavicon();

console.log("\n=== SUMMARY ===");
console.log(`Directories: ${dirsExist ? '✅ All exist' : '❌ Some missing'}`);
console.log(`Assets: ${assetsExist ? '✅ All exist' : '❌ Some missing'}`);
console.log(`Favicon: ${faviconExists ? '✅ Exists' : '❌ Missing'}`);
console.log(`\nOverall status: ${(dirsExist && assetsExist && faviconExists) ? '✅ READY FOR DEPLOYMENT!' : '⚠️ Some files may be missing'}`);
