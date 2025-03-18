import { NodeVoiceGenerator } from './node-voice-generator.js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { VoiceId } from '@aws-sdk/client-polly';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
  console.log(`Loading environment from: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn('No .env file found. Make sure AWS credentials are set in environment variables.');
  dotenv.config();
}

// Define dialogue entries that need audio generation
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
  // Add more dialogue entries as needed
];

async function generateAllVoices() {
  try {
    console.log('Initializing AWS Polly...');
    NodeVoiceGenerator.initialize();
    
    console.log('Starting voice generation for all dialogues...');
    
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
    
    console.log('Voice generation complete!');
    
  } catch (error) {
    console.error('Voice generation process failed:', error);
    process.exit(1);
  }
}

// Run the generation process
generateAllVoices();
