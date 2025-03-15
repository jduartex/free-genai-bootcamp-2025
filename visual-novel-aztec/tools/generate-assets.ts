// @ts-check

import { AIAssetGenerator } from '../src/utils/AIAssetGenerator.js';
import { VoiceGenerator } from '../src/utils/VoiceGenerator.js';
import type { StoryData, DialogEntry } from '../src/types/StoryTypes.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Character definitions for generation
const characterPrompts: Record<string, string> = {
  'tlaloc': 'Male Aztec warrior in his 30s with strong muscular build, weathered face with determined expression, traditional attire, hyperrealistic photography',
  'citlali': 'Female Aztec healer in her early 30s with long black hair tied back, calm expression, simple clothing with symbolic patterns, hyperrealistic photography',
  'diego': 'Spanish conquistador guard in his 40s, stern expression, armor and helmet, hyperrealistic photography'
};

// Scene definitions
const scenePrompts: Record<string, string> = {
  'prison-cell': '16th century Spanish colonial prison cell, dark stone walls, small barred window, wooden bed, dimly lit, realistic',
  'aztec-village': 'Vibrant Aztec village with traditional structures, decorative art, people in traditional clothing, daytime, sunny',
  'spanish-invasion': 'Chaotic scene of Spanish conquistadors invading Aztec territory, soldiers with weapons, battle, smoke, dramatic lighting',
  'hidden-tunnel': 'Narrow earthen escape tunnel, dim lighting, rough-hewn passage, wooden supports, claustrophobic'
};

async function generateAllAssets(): Promise<void> {
  try {
    console.log('Starting asset generation...');
    
    // Create necessary directories
    ensureDirectories();
    
    // Generate scene backgrounds
    console.log('Generating scene backgrounds...');
    const backgroundPromises = Object.entries(scenePrompts).map(
      async ([scene, prompt]) => {
        console.log(`Generating scene: ${scene}`);
        try {
          await AIAssetGenerator.generateBackground(scene, prompt);
          console.log(`✓ Scene ${scene} generated`);
        } catch (error) {
          console.error(`✗ Failed to generate scene ${scene}:`, error);
        }
      }
    );
    
    // Generate character portraits
    console.log('Generating character portraits...');
    const characterPromises = Object.entries(characterPrompts).map(
      async ([character, prompt]) => {
        console.log(`Generating character: ${character}`);
        try {
          await AIAssetGenerator.generateCharacter(character, prompt);
          console.log(`✓ Character ${character} generated`);
        } catch (error) {
          console.error(`✗ Failed to generate character ${character}:`, error);
        }
      }
    );
    
    // Wait for all image generation to complete
    await Promise.allSettled([...backgroundPromises, ...characterPromises]);
    
    // Voice generation would go here if AWS credentials are set up
    // For now, skip this part as it requires AWS API access
    console.log('Skipping voice generation (requires AWS credentials)');
    
    console.log('Asset generation complete!');
  } catch (error) {
    console.error('Asset generation failed:', error);
  }
}

function ensureDirectories(): void {
  // Create necessary directories if they don't exist
  const publicDir = path.resolve(process.cwd(), 'public');
  fs.mkdirSync(publicDir, { recursive: true });
  
  const assetsDir = path.resolve(publicDir, 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });
  
  fs.mkdirSync(path.resolve(assetsDir, 'scenes'), { recursive: true });
  fs.mkdirSync(path.resolve(assetsDir, 'characters'), { recursive: true });
  fs.mkdirSync(path.resolve(assetsDir, 'audio'), { recursive: true });
  fs.mkdirSync(path.resolve(assetsDir, 'ui'), { recursive: true });
}

// Run the asset generation
generateAllAssets();
