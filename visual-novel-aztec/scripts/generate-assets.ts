import { AssetGenerator } from '../src/utils/AssetGenerator';
import { AIAssetGenerator } from '../src/utils/AIAssetGenerator';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

/**
 * Command line utility to generate game assets using AWS Bedrock
 */
async function main() {
  // Check for AWS credentials
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('⚠️ AWS credentials not found in environment variables!');
    console.error('Make sure you have created a .env file with:');
    console.error('AWS_ACCESS_KEY_ID=your_access_key');
    console.error('AWS_SECRET_ACCESS_KEY=your_secret_key');
    console.error('AWS_REGION=us-east-1');
    console.error('BEDROCK_PREFERRED_MODEL=stability.stable-diffusion-xl-v1');
    process.exit(1);
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  const generateAll = args.includes('--all') || args.length === 0;
  const generateBackgrounds = generateAll || args.includes('--backgrounds');
  const generateUI = generateAll || args.includes('--ui');
  const generateCharacters = generateAll || args.includes('--characters');
  const outputDir = args.find(arg => arg.startsWith('--output='))?.split('=')[1];

  console.log('🎮 Aztec Visual Novel Asset Generator 🎮');
  console.log('=========================================');
  console.log(`Using AWS region: ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log(`Using model: ${process.env.BEDROCK_PREFERRED_MODEL || 'stability.stable-diffusion-xl-v1'}`);
  console.log('=========================================\n');

  if (outputDir) {
    // Make sure the output directory exists
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Output directory set to: ${outputDir}\n`);
  }

  let startTime = Date.now();

  try {
    // Generate backgrounds if requested
    if (generateBackgrounds) {
      console.log('\n🏞️  GENERATING SCENE BACKGROUNDS...\n');
      await AssetGenerator.generateSceneBackgrounds();
    }

    // Generate UI elements if requested
    if (generateUI) {
      console.log('\n🖼️  GENERATING UI ELEMENTS...\n');
      await AssetGenerator.generateUIElements();
    }

    // Generate character portraits if requested
    if (generateCharacters) {
      console.log('\n👤 GENERATING CHARACTER PORTRAITS...\n');
      await generateCharacterPortraits();
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n✅ ASSET GENERATION COMPLETE!');
    console.log(`⏱️  Total time: ${totalTime} seconds`);
    console.log('\nAssets are located in the public/assets directory.');
    
  } catch (error) {
    console.error('\n❌ Error during asset generation:', error);
    process.exit(1);
  }
}

/**
 * Generate character portraits using AWS Bedrock
 */
async function generateCharacterPortraits() {
  const characters = [
    {
      name: 'montezuma',
      prompt: 'Portrait of Aztec Emperor Montezuma II, regal, adorned with jade and gold jewelry, feathered headdress, dignified expression, historical accuracy, realistic, detailed',
      negativePrompt: 'cartoon, anime, modern clothing, European features'
    },
    {
      name: 'tlaloc',
      prompt: 'Portrait of Tlaloc, Aztec god of rain, ceremonial blue face paint, jade adornments, rain symbolism, mystical appearance, cultural accuracy',
      negativePrompt: 'cartoon, anime, horror elements, modern, Western interpretation'
    },
    {
      name: 'malinche',
      prompt: 'Portrait of La Malinche, indigenous Nahua woman, traditional Aztec clothing with decorative elements, intelligent expression, realistic, historical accuracy',
      negativePrompt: 'sexualized, European dress, modern interpretation, cartoon'
    }
  ];

  for (const character of characters) {
    console.log(`Generating character: ${character.name}`);
    try {
      const imagePath = await AIAssetGenerator.generateCharacterWithBedrock(
        character.name,
        character.prompt,
        character.negativePrompt
      );
      console.log(`✅ Generated ${character.name}: ${imagePath}`);
    } catch (error) {
      console.error(`❌ Failed to generate ${character.name}:`, error);
    }
  }
}

// Execute the main function
main().catch(console.error);
