import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { BedrockService } from './BedrockService';

/**
 * Utility class for generating game assets using Stable Diffusion API
 * Compatible with various self-hosted APIs like ComfyUI, AUTOMATIC1111, etc.
 */
export class AIAssetGenerator {
  private static readonly API_URL = process.env.SD_API_URL || 'http://localhost:7860';
  
  /**
   * Generate a scene background using Stable Diffusion
   */
  static async generateBackground(
    sceneName: string, 
    prompt: string,
    negativePrompt: string = 'blurry, low quality, cartoon'
  ): Promise<string> {
    try {
      console.log(`Generating background for scene: ${sceneName}`);
      
      const outputPath = path.resolve(process.cwd(), `public/assets/scenes/${sceneName}.jpg`);
      // Ensure directory exists
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      
      // Use Bedrock service to generate image
      const bedrockService = BedrockService.getInstance();
      const imageBase64 = await bedrockService.generateImage(
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
      return await this.createPlaceholderBackground(sceneName, prompt);
    }
  }
  
  /**
   * Generate character portraits using Stable Diffusion
   */
  static async generateCharacter(
    characterName: string,
    prompt: string,
    negativePrompt: string = 'deformed, ugly, bad anatomy'
  ): Promise<string> {
    try {
      // Check if API is available
      const isApiAvailable = await this.checkApiAvailability();
      if (!isApiAvailable) {
        console.log(`Stable Diffusion API not available. Creating placeholder for ${characterName}`);
        return await this.createPlaceholderCharacter(characterName, prompt);
      }

      const params = {
        prompt: `${prompt}, portrait, 16th century, aztec, mesoamerican, detailed, character portrait, 4k`,
        negative_prompt: negativePrompt,
        width: 512,
        height: 768,
        steps: 40,
        sampler_name: 'Euler a',
        cfg_scale: 7
      };
      
      const response = await axios.post(`${this.API_URL}/sdapi/v1/txt2img`, params, { timeout: 10000 });
      const image = response.data.images[0];
      
      // Save the image
      const outputPath = path.resolve(process.cwd(), `public/assets/characters/${characterName}.png`);
      // Ensure directory exists
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      const buffer = Buffer.from(image, 'base64');
      fs.writeFileSync(outputPath, buffer);
      
      return `assets/characters/${characterName}.png`;
    } catch (error) {
      console.warn('Error generating character with Stable Diffusion:', error instanceof Error ? error.message : String(error));
      return await this.createPlaceholderCharacter(characterName, prompt);
    }
  }

  /**
   * Generate character portraits using AWS Bedrock
   */
  static async generateCharacterWithBedrock(
    characterName: string,
    prompt: string,
    negativePrompt: string = 'deformed, ugly, bad anatomy'
  ): Promise<string> {
    try {
      console.log(`Generating character with Bedrock: ${characterName}`);
      
      const outputPath = path.resolve(process.cwd(), `public/assets/characters/${characterName}.png`);
      // Ensure directory exists
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      
      // Use Bedrock service to generate image
      const bedrockService = BedrockService.getInstance();
      const imageBase64 = await bedrockService.generateImage(
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
      return await this.createPlaceholderCharacter(characterName, prompt);
    }
  }

  /**
   * Check if the Stable Diffusion API is available
   */
  private static async checkApiAvailability(): Promise<boolean> {
    try {
      await axios.get(`${this.API_URL}/healthcheck`, { timeout: 3000 });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Create a placeholder background image with text
   */
  private static async createPlaceholderBackground(sceneName: string, description: string): Promise<string> {
    const outputPath = path.resolve(process.cwd(), `public/assets/scenes/${sceneName}.jpg`);
    // Ensure directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    
    // Use NodeJS to create a simple colored rectangle with text as a placeholder
    // In a real implementation, this would use a graphics library like sharp or canvas
    // For now, we just create a text file with the description
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
  private static async createPlaceholderCharacter(characterName: string, description: string): Promise<string> {
    const outputPath = path.resolve(process.cwd(), `public/assets/characters/${characterName}.png`);
    // Ensure directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    
    // Create a placeholder text file
    const placeholderText = `Placeholder image for: ${characterName}\n\nDescription: ${description}`;
    fs.writeFileSync(outputPath, placeholderText);
    
    console.log(`Created placeholder for ${characterName} at ${outputPath}`);
    return `assets/characters/${characterName}.png`;
  }
  
  /**
   * Get a color for a scene based on its name
   */
  private static getColorForScene(sceneName: string): string {
    const colors: Record<string, string> = {
      'prison-cell': '#333344',
      'aztec-village': '#446644',
      'spanish-invasion': '#664444',
      'hidden-tunnel': '#222222'
    };
    
    return colors[sceneName] || '#444444';
  }
  
  /**
   * Generate UI elements using AWS Bedrock
   */
  static async generateUIElement(
    elementName: string,
    prompt: string,
    negativePrompt: string = 'blurry, text, words, low quality'
  ): Promise<string> {
    try {
      console.log(`Generating UI element: ${elementName}`);
      
      const outputPath = path.resolve(process.cwd(), `public/assets/ui/${elementName}.png`);
      // Ensure directory exists
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      
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
      
      // Use Bedrock service to generate image
      const bedrockService = BedrockService.getInstance();
      const imageBase64 = await bedrockService.generateImage(
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
}
