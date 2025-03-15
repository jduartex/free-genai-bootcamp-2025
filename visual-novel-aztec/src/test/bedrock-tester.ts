import { BedrockService } from '../services/BedrockService';
import { UIGenerator } from '../utils/UIGenerator';
import { ImageVariationGenerator } from '../utils/ImageVariationGenerator';
import Phaser from 'phaser';
import fs from 'fs';
import path from 'path';

/**
 * Test script for AWS Bedrock Integration
 * Tests image generation, UI generation, and image variation capabilities
 */

// Helper function to save a Base64 image to a file
async function saveBase64Image(base64: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Create the directory if it doesn't exist
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Convert base64 to buffer and save to file
      const imageBuffer = Buffer.from(base64, 'base64');
      fs.writeFileSync(outputPath, imageBuffer);
      console.log(`✅ Image saved to: ${outputPath}`);
      resolve();
    } catch (error) {
      console.error('❌ Error saving image:', error);
      reject(error);
    }
  });
}

// Test scene for Phaser-related testing
class TestScene extends Phaser.Scene {
  constructor() {
    super('TestScene');
  }

  preload() {
    // Load test character image
    this.load.image('test-character', 'assets/characters/tlaloc.png');
  }

  create() {
    console.log('✅ Test scene created');
  }
}

// Create minimal Phaser game for testing
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.HEADLESS,
  width: 800,
  height: 600,
  scene: [TestScene]
};

// Main test function
async function runBedrockTests(): Promise<void> {
  console.log('🔍 STARTING AWS BEDROCK TESTS');
  console.log('============================\n');
  
  try {
    const outputDir = path.join(__dirname, '../../test-output');
    
    // 1. Test Direct Bedrock Image Generation
    console.log('TEST 1: Direct Bedrock Image Generation');
    const bedrock = BedrockService.getInstance();
    
    console.log('Generating test image...');
    const imageBase64 = await bedrock.generateImage(
      "An Aztec temple in the jungle with detailed stone carvings",
      "blurry, low quality",
      512,
      512
    );
    
    await saveBase64Image(
      imageBase64, 
      path.join(outputDir, 'bedrock-direct-generation.png')
    );
    console.log('✅ Direct image generation test completed\n');
    
    // 2. Test UI Generator
    console.log('TEST 2: UI Generator');
    const uiGenerator = UIGenerator.getInstance();
    
    console.log('Generating dialog box...');
    const dialogBoxBase64 = await uiGenerator.generateDialogBox('Aztec stone with gold inlays');
    await saveBase64Image(
      dialogBoxBase64,
      path.join(outputDir, 'ui-dialog-box.png')
    );
    
    console.log('Generating button...');
    const buttonBase64 = await uiGenerator.generateButton('ancient stone carving', 'Start');
    await saveBase64Image(
      buttonBase64,
      path.join(outputDir, 'ui-button.png')
    );
    console.log('✅ UI Generator test completed\n');
    
    // 3. Test Image Variation Generator (requires Phaser setup)
    console.log('TEST 3: Image Variation Generator');
    console.log('Initializing Phaser for image testing...');
    
    const game = new Phaser.Game(config);
    
    // Wait for the game to be ready
    await new Promise<void>(resolve => {
      game.events.once('ready', () => {
        resolve();
      });
      
      // Fallback if event doesn't fire
      setTimeout(resolve, 1000);
    });
    
    const scene = game.scene.getScene('TestScene') as TestScene;
    if (!scene) {
      throw new Error('Test scene not found');
    }
    
    // Ensure assets are loaded
    await new Promise<void>(resolve => {
      if (scene.load.isLoading()) {
        scene.load.once('complete', () => resolve());
      } else {
        resolve();
      }
    });
    
    console.log('Phaser initialized, testing character variations...');
    const imageVariationGenerator = ImageVariationGenerator.getInstance();
    
    // Test with some expressions
    const expressions = ['happy', 'sad', 'surprised', 'angry'];
    for (const expression of expressions) {
      console.log(`Generating "${expression}" expression...`);
      
      const expressionBase64 = await imageVariationGenerator.generateCharacterExpression(
        scene,
        'tlaloc',
        expression,
        'test-character'
      );
      
      if (expressionBase64) {
        await saveBase64Image(
          expressionBase64,
          path.join(outputDir, `character-${expression}.png`)
        );
      } else {
        console.warn(`⚠️ No result returned for "${expression}" expression`);
      }
    }
    
    console.log('✅ Image Variation Generator test completed');
    
    // Clean up
    game.destroy(true);
    
    console.log('\n============================');
    console.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY');
    console.log(`📁 Results saved in: ${outputDir}`);
  } catch (error) {
    console.error('❌ Error during tests:', error);
    process.exit(1);
  }
}

// Check for AWS credentials
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.warn('⚠️ AWS credentials not found in environment variables!');
  console.log('ℹ️ Make sure AWS credentials are configured before running the tests.');
}

// Run the tests
runBedrockTests()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
