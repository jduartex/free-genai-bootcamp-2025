import { AIAssetGenerator } from './AIAssetGenerator';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Helper class to generate game assets using the AWS Bedrock integration
 */
export class AssetGenerator {
  /**
   * Generate scene backgrounds for the game
   */
  static async generateSceneBackgrounds() {
    const scenes = [
      {
        name: 'tenochtitlan-market',
        prompt: 'A vibrant Aztec marketplace in Tenochtitlan, with colorful goods, traders, and pyramids in the background. Golden hour lighting, detailed stone architecture.',
        negativePrompt: 'modern elements, blurry, low quality'
      },
      {
        name: 'temple-exterior',
        prompt: 'An imposing Aztec temple exterior with steep stairs, stone carvings, and ceremonial decorations. Dramatic sky, atmospheric lighting.',
        negativePrompt: 'interior, modern elements, tourists, blurry'
      },
      {
        name: 'royal-palace',
        prompt: 'The grand interior of an Aztec royal palace with detailed tapestries, golden ornaments, and elaborate throne. Warm, ambient lighting through windows.',
        negativePrompt: 'modern elements, European style, blurry, low quality'
      }
    ];

    console.log('⏳ Generating scene backgrounds...');
    
    for (const scene of scenes) {
      console.log(`Generating: ${scene.name}`);
      try {
        const path = await AIAssetGenerator.generateBackground(
          scene.name,
          scene.prompt,
          scene.negativePrompt
        );
        console.log(`✅ Generated ${scene.name}: ${path}`);
      } catch (error) {
        console.error(`❌ Failed to generate ${scene.name}:`, error);
      }
    }
  }

  /**
   * Generate UI elements for the game
   */
  static async generateUIElements() {
    const uiElements = [
      {
        name: 'dialog-box',
        prompt: 'A beautiful dialog box for a visual novel game with an Aztec stone with gold inlays aesthetic. The design should have empty space in the middle for text. Semi-transparent, elegant design with Aztec ornaments and decorations around the border.',
        negativePrompt: 'text, words, intrusive elements in the center, blur, low quality'
      },
      {
        name: 'button-default',
        prompt: 'A high-quality UI button with an ancient Aztec stone carving style. Clean, isometric view, suitable for a visual novel game. The button should have gold accents and feature subtle Aztec patterns.',
        negativePrompt: 'text, words, labels, blur, distortion, low quality, flat design'
      },
      {
        name: 'menu-background',
        prompt: 'An elegant menu background with subtle Aztec patterns and symbols. Semi-transparent dark stone texture with gold highlights and decorative elements around the edges.',
        negativePrompt: 'text, words, buttons, UI elements, blur, noise'
      }
    ];

    console.log('⏳ Generating UI elements...');
    
    for (const element of uiElements) {
      console.log(`Generating: ${element.name}`);
      try {
        const path = await AIAssetGenerator.generateUIElement(
          element.name,
          element.prompt,
          element.negativePrompt
        );
        console.log(`✅ Generated ${element.name}: ${path}`);
      } catch (error) {
        console.error(`❌ Failed to generate ${element.name}:`, error);
      }
    }
  }
}

// You can uncomment and use these functions to generate assets as needed
// AssetGenerator.generateSceneBackgrounds();
// AssetGenerator.generateUIElements();
