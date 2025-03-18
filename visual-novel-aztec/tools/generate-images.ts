#!/usr/bin/env node

import { BedrockAssetGenerator } from '../src/utils/BedrockAssetGenerator.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set output directory relative to project
const assetOutputDir = path.join(__dirname, '../assets/generated');

async function generateGameAssets() {
  console.log('🎮 Generating Visual Novel Game Assets with AWS Bedrock');
  console.log('=====================================================\n');
  
  try {
    const generator = new BedrockAssetGenerator(assetOutputDir);
    
    // Generate characters
    console.log('\n🧍 GENERATING CHARACTERS:');
    await generator.generateCharacter(
      'Priest', 
      'An Aztec high priest with elaborate headdress, ritualistic face paint, and ornate clothing with gold accents and jade jewelry'
    );
    
    await generator.generateCharacter(
      'Warrior', 
      'A strong Aztec warrior with jaguar helmet, war paint, and carrying traditional weapons like atlatl and macuahuitl'
    );
    
    // Generate backgrounds
    console.log('\n🏞️ GENERATING BACKGROUNDS:');
    await generator.generateBackground(
      'Temple', 
      'Ancient Aztec temple with steep stairs, stone carvings, and colorful murals, set against a jungle background'
    );
    
    await generator.generateBackground(
      'City', 
      'Bustling Aztec city with canals, market stalls, pyramids in the distance, and people going about daily activities'
    );
    
    // Generate game objects
    console.log('\n🧩 GENERATING GAME OBJECTS:');
    await generator.generateGameObject(
      'Codex', 
      'Ancient Aztec codex or book with colorful hieroglyphs and paintings on a folded bark paper'
    );
    
    await generator.generateGameObject(
      'Idol', 
      'Small stone idol representing an Aztec deity, with intricate carvings and slight weathering'
    );
    
    console.log('\n✅ Asset generation complete! Files saved to:', assetOutputDir);
  } catch (error) {
    console.error('❌ Error generating assets:', error);
    process.exit(1);
  }
}

// Execute the function
generateGameAssets();
