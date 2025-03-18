#!/usr/bin/env node

/**
 * One-stop script to fix asset issues
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Get project root
const projectRoot = process.cwd();
const publicAssetsDir = path.join(projectRoot, 'public/assets');

// Create asset directories if they don't exist
const dirs = [
  'scenes',
  'characters',
  'ui',
  'objects',
  'audio'
];

console.log('Ensuring asset directories exist...');
for (const dir of dirs) {
  const dirPath = path.join(publicAssetsDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

// Generate asset manifest
console.log('\nGenerating asset manifest...');
const manifest = {
  backgrounds: [],
  characters: [],
  ui: [],
  objects: [],
  audio: [],
  generatedAt: new Date().toISOString()
};

// Manually scan directories with fs
function scanDir(dirPath, relativePath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory does not exist: ${dirPath}`);
    return [];
  }
  
  try {
    const files = fs.readdirSync(dirPath)
      .filter(file => !file.startsWith('.')) // Skip hidden files
      .map(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (!stats.isFile()) return null;
        
        console.log(`Found file in ${relativePath}: ${file}`);
        
        return {
          name: path.basename(file, path.extname(file)),
          path: `assets/${relativePath}/${file}`
        };
      })
      .filter(Boolean); // Remove null entries
    
    return files;
  } catch (err) {
    console.error(`Error reading directory ${dirPath}:`, err);
    return [];
  }
}

// Scan directories with multiple extensions, prioritizing proper image files over placeholders
function scanDirWithExtensions(dirPath, relativePath, extensions = ['.png', '.jpg', '.jpeg']) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory does not exist: ${dirPath}`);
    return [];
  }
  
  try {
    console.log(`Scanning ${dirPath} for files with extensions: ${extensions.join(', ')}`);
    
    const allFiles = fs.readdirSync(dirPath);
    console.log(`Total files found in ${relativePath}: ${allFiles.length}`);
    
    // First pass: collect all files by basename
    const filesByName = new Map();
    
    allFiles
      .filter(file => !file.startsWith('.')) // Skip hidden files
      .forEach(file => {
        const ext = path.extname(file).toLowerCase();
        const baseName = path.basename(file, ext);
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (!stats.isFile()) return;
        
        // If we don't have this basename yet, or if this is a preferred extension
        // (.png/.jpg is preferred over .html)
        if (!filesByName.has(baseName) || 
            (extensions.indexOf(ext) < extensions.indexOf(filesByName.get(baseName).ext))) {
          filesByName.set(baseName, {
            name: baseName,
            path: `assets/${relativePath}/${file}`,
            ext: ext
          });
          console.log(`Found ${relativePath} file: ${file} (${ext})`);
        }
      });
    
    return Array.from(filesByName.values());
  } catch (err) {
    console.error(`Error reading directory ${dirPath}:`, err);
    return [];
  }
}

// Scan each directory with appropriate extensions, prioritizing proper image files
const sceneFiles = scanDirWithExtensions(path.join(publicAssetsDir, 'scenes'), 'scenes', ['.jpg', '.jpeg', '.png', '.html']);
manifest.backgrounds = sceneFiles
  .map(file => ({
    sceneName: file.name,
    imagePath: file.path
  }));

// For characters, look for PNG/JPG files and prioritize them over placeholders
const characterFiles = scanDirWithExtensions(path.join(publicAssetsDir, 'characters'), 'characters', ['.png', '.jpg', '.jpeg', '.html']);
manifest.characters = characterFiles
  .map(file => ({
    characterName: file.name,
    imagePath: file.path
  }));

const uiFiles = scanDir(path.join(publicAssetsDir, 'ui'), 'ui');
manifest.ui = uiFiles.map(file => ({
  elementName: file.name,
  imagePath: file.path
}));

const objectFiles = scanDir(path.join(publicAssetsDir, 'objects'), 'objects');
manifest.objects = objectFiles.map(file => ({
  objectName: file.name,
  imagePath: file.path
}));

const audioFiles = scanDir(path.join(publicAssetsDir, 'audio'), 'audio');
manifest.audio = audioFiles.map(file => ({
  soundName: file.name,
  soundPath: file.path
}));

// Write the manifest file
fs.writeFileSync(
  path.join(publicAssetsDir, 'asset-manifest.json'), 
  JSON.stringify(manifest, null, 2)
);

console.log(`Asset manifest created with:
- ${manifest.backgrounds.length} backgrounds
- ${manifest.characters.length} characters
- ${manifest.ui.length} UI elements
- ${manifest.objects.length} objects
- ${manifest.audio.length} audio files
`);

// Print detailed summary
console.log('\nDetailed Asset Summary:');
console.log('======================');
console.log('Backgrounds:');
manifest.backgrounds.forEach(bg => console.log(`- ${bg.sceneName}: ${bg.imagePath}`));

console.log('\nCharacters:');
manifest.characters.forEach(char => console.log(`- ${char.characterName}: ${char.imagePath}`));

console.log('\nUI Elements:');
manifest.ui.forEach(ui => console.log(`- ${ui.elementName}: ${ui.imagePath}`));

console.log('Asset fix complete!');
