#!/usr/bin/env node

/**
 * Asset generator script for Aztec Visual Novel
 * Generates backgrounds, UI elements, and character portraits using AWS Bedrock
 * This script is a standalone JS file that doesn't rely on TypeScript imports
 */
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// For ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

/**
 * Asset Generator Class - Self-contained implementation
 */
class AztecAssetGenerator {
  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.client = new BedrockRuntimeClient({ region: this.region });
    this.preferredModel = process.env.BEDROCK_PREFERRED_MODEL || 'stability.stable-diffusion-xl-v1';
  }

  /**
   * Generate an image based on text prompt
   */
  async generateImage(prompt, negativePrompt = '', width = 512, height = 512) {
    const requestData = this.buildImageRequest(prompt, negativePrompt, width, height);
    
    try {
      return await this.invokeModel(this.preferredModel, requestData);
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }
  
  /**
   * Build the appropriate request format based on the model
   */
  buildImageRequest(prompt, negativePrompt, width, height) {
    const model = this.preferredModel;
    
    if (model.startsWith("stability.")) {
      return {
        text_prompts: [
          { text: prompt, weight: 1.0 },
          { text: negativePrompt, weight: -1.0 }
        ],
        cfg_scale: 7,
        steps: 30,
        seed: Math.floor(Math.random() * 1000000),
        width,
        height
      };
    } else if (model.startsWith("amazon.titan")) {
      return {
        textPrompt: prompt,
        negativePrompt: negativePrompt,
        width,
        height,
        quality: "standard",
        cfgScale: 7,
        seed: Math.floor(Math.random() * 1000000)
      };
    } else {
      return {
        text_prompts: [
          { text: prompt, weight: 1.0 },
          { text: negativePrompt, weight: -1.0 }
        ],
        cfg_scale: 7,
        steps: 30,
        seed: Math.floor(Math.random() * 1000000),
        width,
        height
      };
    }
  }
  
  /**
   * Invoke the Bedrock model with the given data
   */
  async invokeModel(modelId, requestData) {
    const command = new InvokeModelCommand({
      modelId,
      body: JSON.stringify(requestData),
      contentType: "application/json",
      accept: "application/json"
    });

    const response = await this.client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Handle different response formats from different models
    if (responseBody.artifacts && responseBody.artifacts.length > 0) {
      return responseBody.artifacts[0].base64;
    } else if (responseBody.images && responseBody.images.length > 0) {
      return responseBody.images[0].base64; 
    } else if (responseBody.image) {
      return responseBody.image;
    } else {
      throw new Error("Unexpected response format: " + JSON.stringify(responseBody));
    }
  }

  /**
   * Generate a scene background using Bedrock
   */
  async generateBackground(sceneName, prompt, negativePrompt = 'blurry, low quality, cartoon') {
    try {
      console.log(`Generating background for scene: ${sceneName}`);
      
      const outputPath = resolve(process.cwd(), `public/assets/scenes/${sceneName}.jpg`);
      // Ensure directory exists
      fs.mkdirSync(dirname(outputPath), { recursive: true });
      
      const imageBase64 = await this.generateImage(
        prompt,
        negativePrompt,
        1024, // Width suitable for background
        768   // Height suitable for background
      );
      
      // Save the image to the file system
      const buffer = Buffer.from(imageBase64, 'base64');
      fs.writeFileSync(outputPath, buffer);
      
      return `assets/scenes/${sceneName}.jpg`;
    } catch (error) {
      console.warn('Error generating image with Bedrock:', error instanceof Error ? error.message : String(error));
      return this.createPlaceholderBackground(sceneName, prompt);
    }
  }

  /**
   * Generate a UI element using Bedrock
   */
  async generateUIElement(elementName, prompt, negativePrompt = 'blurry, text, words, low quality') {
    try {
      console.log(`Generating UI element: ${elementName}`);
      
      const outputPath = resolve(process.cwd(), `public/assets/ui/${elementName}.png`);
      // Ensure directory exists
      fs.mkdirSync(dirname(outputPath), { recursive: true });
      
      // Determine dimensions based on element type
      let width = 512;
      let height = 512;
      
      if (elementName.includes('dialog')) {
        width = 768;
        height = 256;
      } else if (elementName.includes('button')) {
        width = 320;
        height = 256;
      }
      
      const imageBase64 = await this.generateImage(
        prompt,
        negativePrompt,
        width,
        height
      );
      
      // Save the image to the file system
      const buffer = Buffer.from(imageBase64, 'base64');
      fs.writeFileSync(outputPath, buffer);
      
      console.log(`UI element generated and saved: ${outputPath}`);
      return `assets/ui/${elementName}.png`;
    } catch (error) {
      console.error(`Error generating UI element ${elementName}:`, error);
      return `assets/ui/placeholder-${elementName}.png`;
    }
  }

  /**
   * Generate character portraits using Bedrock
   */
  async generateCharacter(characterName, prompt, negativePrompt = 'deformed, ugly, bad anatomy') {
    try {
      console.log(`Generating character with Bedrock: ${characterName}`);
      
      const outputPath = resolve(process.cwd(), `public/assets/characters/${characterName}.png`);
      // Ensure directory exists
      fs.mkdirSync(dirname(outputPath), { recursive: true });
      
      const imageBase64 = await this.generateImage(
        `${prompt}, portrait, 16th century, aztec, mesoamerican, detailed, character portrait, 4k`,
        negativePrompt,
        512, // Width suitable for character portrait
        768  // Height suitable for character portrait
      );
      
      // Save the image to the file system
      const buffer = Buffer.from(imageBase64, 'base64');
      fs.writeFileSync(outputPath, buffer);
      
      console.log(`Character generated and saved: ${outputPath}`);
      return `assets/characters/${characterName}.png`;
    } catch (error) {
      console.warn('Error generating character with Bedrock:', error instanceof Error ? error.message : String(error));
      return this.createPlaceholderCharacter(characterName, prompt);
    }
  }

  /**
   * Create a placeholder background image with text
   */
  createPlaceholderBackground(sceneName, description) {
    const outputPath = resolve(process.cwd(), `public/assets/scenes/${sceneName}.jpg`);
    // Ensure directory exists
    fs.mkdirSync(dirname(outputPath), { recursive: true });
    
    const placeholderText = `Placeholder image for: ${sceneName}\n\nDescription: ${description}`;
    const htmlContent = `
      <html>
        <head>
          <style>
            body { 
              margin: 0; 
              display: flex; 
              justify-content: center; 
              align-items: center;
              width: 1280px;
              height: 720px;
              background-color: ${this.getColorForScene(sceneName)};
              color: white;
              font-family: sans-serif;
              padding: 2rem;
              box-sizing: border-box;
              text-align: center;
            }
            h1 { margin-bottom: 2rem; }
          </style>
        </head>
        <body>
          <div>
            <h1>${sceneName}</h1>
            <p>${description}</p>
          </div>
        </body>
      </html>
    `;
    
    // Write the placeholder file
    fs.writeFileSync(outputPath.replace('.jpg', '.html'), htmlContent);
    fs.writeFileSync(outputPath, placeholderText);
    
    console.log(`Created placeholder for ${sceneName} at ${outputPath}`);
    return `assets/scenes/${sceneName}.jpg`;
  }

  /**
   * Create a placeholder character image
   */
  createPlaceholderCharacter(characterName, description) {
    const outputPath = resolve(process.cwd(), `public/assets/characters/${characterName}.png`);
    // Ensure directory exists
    fs.mkdirSync(dirname(outputPath), { recursive: true });
    
    // Create a placeholder text file
    const placeholderText = `Placeholder image for: ${characterName}\n\nDescription: ${description}`;
    fs.writeFileSync(outputPath, placeholderText);
    
    console.log(`Created placeholder for ${characterName} at ${outputPath}`);
    return `assets/characters/${characterName}.png`;
  }

  /**
   * Get a color for a scene based on its name
   */
  getColorForScene(sceneName) {
    const colors = {
      'prison-cell': '#333344',
      'aztec-village': '#446644',
      'spanish-invasion': '#664444',
      'hidden-tunnel': '#222222',
      'tenochtitlan-market': '#558844',
      'temple-exterior': '#884422',
      'royal-palace': '#AA8866'
    };
    
    return colors[sceneName] || '#444444';
  }
}

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

  const generator = new AztecAssetGenerator();

  console.log('🎮 Aztec Visual Novel Asset Generator 🎮');
  console.log('=========================================');
  console.log(`Using AWS region: ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log(`Using model: ${process.env.BEDROCK_PREFERRED_MODEL || 'stability.stable-diffusion-xl-v1'}`);
  console.log('=========================================\n');

  let startTime = Date.now();

  try {
    // Generate backgrounds if requested
    if (generateBackgrounds) {
      console.log('\n🏞️  GENERATING SCENE BACKGROUNDS...\n');
      await generateSceneBackgrounds(generator);
    }

    // Generate UI elements if requested
    if (generateUI) {
      console.log('\n🖼️  GENERATING UI ELEMENTS...\n');
      await generateUIElements(generator);
    }

    // Generate character portraits if requested
    if (generateCharacters) {
      console.log('\n👤 GENERATING CHARACTER PORTRAITS...\n');
      await generateCharacterPortraits(generator);
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
 * Generate scene backgrounds for the game
 */
async function generateSceneBackgrounds(generator) {
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
      const path = await generator.generateBackground(
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
async function generateUIElements(generator) {
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
      const path = await generator.generateUIElement(
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

/**
 * Generate character portraits using AWS Bedrock
 */
async function generateCharacterPortraits(generator) {
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
      const imagePath = await generator.generateCharacter(
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
