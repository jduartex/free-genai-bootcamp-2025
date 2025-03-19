import { BedrockAssetGenerator } from '../src/utils/BedrockAssetGenerator.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

/**
 * Command line utility to generate game assets using AWS Bedrock
 * This is a compatibility wrapper around the new BedrockAssetGenerator
 */
async function main() {
  console.log('⚠️ This script is deprecated. Please use "npm run generate:all" instead.');
  console.log('Running asset generation using BedrockAssetGenerator...\n');
  
  const outputDir = path.resolve(process.cwd(), 'assets/generated');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    const generator = new BedrockAssetGenerator(outputDir);
    
    // Generate characters
    console.log('\n🧍 GENERATING CHARACTERS:');
    await generator.generateCharacter(
      'Priest', 
      'An Aztec high priest with elaborate headdress, ritualistic face paint, and ornate clothing'
    );
    
    // Generate backgrounds
    console.log('\n🏞️ GENERATING BACKGROUNDS:');
    await generator.generateBackground(
      'Temple', 
      'Ancient Aztec temple with steep stairs, stone carvings, and colorful murals'
    );
    
    console.log('\n✅ Asset generation complete!');
    
  } catch (error) {
    console.error('\n❌ Error during asset generation:', error);
    process.exit(1);
  }
}

// Execute the main function
main().catch(console.error);
