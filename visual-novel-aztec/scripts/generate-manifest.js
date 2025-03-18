#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob'; // Changed from 'import glob from 'glob'

// Get directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Asset directories
const assetDirs = {
  scenes: path.join(projectRoot, 'public/assets/scenes'),
  characters: path.join(projectRoot, 'public/assets/characters'),
  ui: path.join(projectRoot, 'public/assets/ui'),
  objects: path.join(projectRoot, 'public/assets/objects'),
  audio: path.join(projectRoot, 'public/assets/audio')
};

// Check if directory exists
function dirExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
}

// Get all files of certain extensions in a directory
function getFilesInDir(dir, exts = ['.jpg', '.png']) {
  if (!dirExists(dir)) {
    console.warn(`Directory doesn't exist: ${dir}`);
    return [];
  }
  
  let allFiles = [];
  for (const ext of exts) {
    try {
      // Use fs.readdirSync instead of glob for more reliability
      const files = fs.readdirSync(dir)
        .filter(file => file.toLowerCase().endsWith(ext))
        .map(file => path.basename(file));
      allFiles.push(...files);
    } catch (err) {
      console.warn(`Error reading directory ${dir} for extension ${ext}:`, err);
    }
  }
  return allFiles;
}

// Generate the manifest
function generateManifest() {
  // Initialize manifest object
  const manifest = {
    backgrounds: [],
    characters: [],
    ui: [],
    objects: [],
    audio: [],
    generatedAt: new Date().toISOString()
  };
  
  // Get background scenes
  if (dirExists(assetDirs.scenes)) {
    const sceneFiles = getFilesInDir(assetDirs.scenes, ['.jpg', '.jpeg', '.png']);
    manifest.backgrounds = sceneFiles.map(file => {
      const sceneName = path.basename(file, path.extname(file));
      return {
        sceneName,
        imagePath: `assets/scenes/${file}`
      };
    });
    console.log(`Found ${manifest.backgrounds.length} backgrounds`);
  }
  
  // Get character images
  if (dirExists(assetDirs.characters)) {
    const characterFiles = getFilesInDir(assetDirs.characters, ['.png', '.jpg']);
    manifest.characters = characterFiles.map(file => {
      const characterName = path.basename(file, path.extname(file));
      return {
        characterName,
        imagePath: `assets/characters/${file}`
      };
    });
    console.log(`Found ${manifest.characters.length} characters`);
  }
  
  // Get UI elements
  if (dirExists(assetDirs.ui)) {
    const uiFiles = getFilesInDir(assetDirs.ui, ['.png']);
    manifest.ui = uiFiles.map(file => {
      const elementName = path.basename(file, path.extname(file));
      return {
        elementName,
        imagePath: `assets/ui/${file}`
      };
    });
    console.log(`Found ${manifest.ui.length} UI elements`);
  }
  
  // Get objects
  if (dirExists(assetDirs.objects)) {
    const objectFiles = getFilesInDir(assetDirs.objects, ['.png', '.jpg']);
    manifest.objects = objectFiles.map(file => {
      const objectName = path.basename(file, path.extname(file));
      return {
        objectName,
        imagePath: `assets/objects/${file}`
      };
    });
    console.log(`Found ${manifest.objects.length} objects`);
  }
  
  // Get audio files
  if (dirExists(assetDirs.audio)) {
    const audioFiles = getFilesInDir(assetDirs.audio, ['.mp3', '.ogg', '.wav']);
    manifest.audio = audioFiles.map(file => {
      const soundName = path.basename(file, path.extname(file));
      return {
        soundName,
        soundPath: `assets/audio/${file}`
      };
    });
    console.log(`Found ${manifest.audio.length} audio files`);
  }
  
  return manifest;
}

// Main function
function main() {
  console.log('Generating asset manifest...');
  const manifest = generateManifest();
  
  // Write the manifest file
  const manifestPath = path.join(projectRoot, 'public/assets/asset-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  console.log(`Asset manifest created at: ${manifestPath}`);
}

// Run the script
main();
