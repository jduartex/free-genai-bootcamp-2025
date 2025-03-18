#!/usr/bin/env node

import { BedrockAssetGenerator } from '../src/utils/BedrockAssetGenerator.js';
import { NodeVoiceGenerator } from './node-voice-generator.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set output directories
const imageOutputDir = path.join(__dirname, '../assets/generated');
const audioOutputDir = path.join(__dirname, '../assets/audio');

// Ensure output directories exist
if (!fs.existsSync(imageOutputDir)) {
  fs.mkdirSync(imageOutputDir, { recursive: true });
}
if (!fs.existsSync(audioOutputDir)) {
  fs.mkdirSync(audioOutputDir, { recursive: true });
}

async function generateAllAssets() {
  console.log('🎮 Visual Novel Asset Generation');
  console.log('===============================\n');
  
  try {
    // Part 1: Generate Images with BedrockAssetGenerator
    console.log('📸 Generating Images with AWS Bedrock...\n');
    await generateImages();
    
    // Part 2: Generate Audio with NodeVoiceGenerator
    console.log('\n🔊 Generating Audio with AWS Polly...\n');
    await generateAudio();
    
    console.log('\n✅ All assets generated successfully!');
    console.log(`📁 Images saved to: ${imageOutputDir}`);
    console.log(`📁 Audio saved to: ${audioOutputDir}`);
  } catch (error) {
    console.error('\n❌ Error generating assets:', error);
    process.exit(1);
  }
}

async function generateImages() {
  const generator = new BedrockAssetGenerator(imageOutputDir);
  
  // Generate characters
  console.log('🧍 GENERATING CHARACTERS:');
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
}

async function generateAudio() {
  // Initialize NodeVoiceGenerator
  NodeVoiceGenerator.initialize();
  
  // Define dialogue entries
  const dialogues = [
    {
      id: 'intro_tlaloc_001',
      text: 'この牢屋から出なければなりません。早く！',
      character: 'tlaloc',
      language: 'ja-JP'
    },
    {
      id: 'intro_citlali_001',
      text: '窓の近くを調べましょう。何かヒントがあるかもしれません。',
      character: 'citlali',
      language: 'ja-JP'
    },
    {
      id: 'intro_diego_001',
      text: '囚人たち、静かにしろ！',
      character: 'diego',
      language: 'ja-JP'
    }
  ];
  
  // Generate audio for each dialogue
  for (const dialogue of dialogues) {
    console.log(`Processing: ${dialogue.id} for character ${dialogue.character}`);
    
    const voice = NodeVoiceGenerator.getVoiceForCharacter(dialogue.character);
    
    try {
      const outputPath = await NodeVoiceGenerator.generateVoiceForDialogue(
        dialogue.id,
        dialogue.text,
        dialogue.language as 'ja-JP' | 'en-US' | 'es-ES',
        voice
      );
      
      console.log(`✅ Generated audio: ${outputPath}`);
    } catch (error) {
      console.error(`❌ Failed to generate audio for ${dialogue.id}:`, error);
    }
  }
}

// Run the script
generateAllAssets();
