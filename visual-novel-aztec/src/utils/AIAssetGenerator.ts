import axios from 'axios';
import fs from 'fs';
import path from 'path';

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
      // Check if API is available
      const isApiAvailable = await this.checkApiAvailability();
      if (!isApiAvailable) {
        console.log(`Stable Diffusion API not available. Creating placeholder for ${sceneName}`);
        return await this.createPlaceholderBackground(sceneName, prompt);
      }

      const params = {
        prompt: `${prompt}, 16th century, aztec, mesoamerican, detailed, realistic painting, 4k, wide angle shot`,
        negative_prompt: negativePrompt,
        width: 1280,
        height: 720,
        steps: 30,
        sampler_name: 'DPM++ 2M Karras',
        cfg_scale: 7
      };
      
      const response = await axios.post(`${this.API_URL}/sdapi/v1/txt2img`, params, { timeout: 10000 });
      const image = response.data.images[0];
      
      // Save the image
      const outputPath = path.resolve(process.cwd(), `public/assets/scenes/${sceneName}.jpg`);
      // Ensure directory exists
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      const buffer = Buffer.from(image, 'base64');
      fs.writeFileSync(outputPath, buffer);
      
      return `assets/scenes/${sceneName}.jpg`;
    } catch (error) {
      console.warn('Error generating image with Stable Diffusion:', error instanceof Error ? error.message : String(error));
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
    prompt: string
  ): Promise<string> {
    // Implementation for AWS Bedrock would go here
    // For now, we'll placeholder
    console.log(`Generating UI element: ${elementName} with prompt: ${prompt}`);
    return `assets/ui/${elementName}.png`;
  }
}
