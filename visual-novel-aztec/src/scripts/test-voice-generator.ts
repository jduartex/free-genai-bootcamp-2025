import { NodeVoiceGenerator } from '../../tools/node-voice-generator.js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

if (fs.existsSync(envPath)) {
  console.log(`Loading environment from: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn('No .env file found. Make sure AWS credentials are set in environment variables.');
  dotenv.config();
}

// Sample dialogues for testing
const sampleDialogues = [
  {
    id: 'test_tlaloc_001',
    text: 'この牢屋から出なければなりません。早く！',
    character: 'tlaloc',
    language: 'ja-JP',
    translation: 'We must get out of this prison cell. Hurry!'
  },
  {
    id: 'test_citlali_001',
    text: '窓の近くを調べましょう。何かヒントがあるかもしれません。',
    character: 'citlali',
    language: 'ja-JP',
    translation: "Let's examine near the window. There might be some clues."
  },
  {
    id: 'test_diego_001',
    text: '囚人たち、静かにしろ！',
    character: 'diego',
    language: 'ja-JP', 
    translation: 'Prisoners, be quiet!'
  }
];

async function testVoiceGeneration() {
  try {
    console.log('Initializing AWS SDK and Voice Generator...');
    NodeVoiceGenerator.initialize();
    
    console.log('Starting voice generation tests...');
    console.log('--------------------------------');
    
    for (const dialogue of sampleDialogues) {
      console.log(`Processing: "${dialogue.id}"`);
      console.log(`Character: ${dialogue.character}`);
      console.log(`Text: ${dialogue.text}`);
      console.log(`Translation: ${dialogue.translation}`);
      
      const characterVoice = NodeVoiceGenerator.getVoiceForCharacter(dialogue.character);
      console.log(`Selected voice: ${characterVoice}`);
      
      try {
        console.log('Generating voice...');
        const outputPath = await NodeVoiceGenerator.generateVoiceForDialogue(
          dialogue.id,
          dialogue.text,
          dialogue.language as 'ja-JP' | 'en-US',
          characterVoice
        );
        
        console.log(`✅ Voice generated successfully!`);
        console.log(`Output: ${outputPath}`);
      } catch (error) {
        console.error(`❌ Error generating voice for ${dialogue.id}:`, error);
      }
      
      console.log('--------------------------------');
    }
    
    console.log('All tests completed.');
    
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

// Run the test function
testVoiceGeneration();
