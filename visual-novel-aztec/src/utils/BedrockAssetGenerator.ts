import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Load environment variables
dotenv.config();

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class BedrockAssetGenerator {
  private client: BedrockRuntimeClient;
  private outputDir: string;
  private activeImageModelId: string;
  
  constructor(outputDir: string, region = "us-east-1") {
    this.client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || region });
    this.outputDir = outputDir;
    this.activeImageModelId = process.env.BEDROCK_PREFERRED_MODEL || "stability.stable-diffusion-xl-v1";
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }
  
  /**
   * Generate a character image
   * @param characterName Name of the character
   * @param description Character description 
   */
  async generateCharacter(characterName: string, description: string): Promise<string> {
    console.log(`Generating character: ${characterName}`);
    
    const prompt = `A detailed concept art of an Aztec character: ${description}. Full body, detailed, 
                    high quality, professional game art style, vibrant colors, clear lighting.`;
                    
    const negativePrompt = "blurry, low quality, deformed, ugly, bad anatomy, text, watermark";
    
    const request = this.buildImageRequest(prompt, negativePrompt);
    const imageBase64 = await this.invokeModel(this.activeImageModelId, request);
    
    const outputPath = path.join(this.outputDir, `character-${characterName.toLowerCase().replace(/\s+/g, '-')}.png`);
    await this.saveBase64Image(imageBase64, outputPath);
    
    return outputPath;
  }
  
  /**
   * Generate a background scene
   * @param sceneName Name of the scene
   * @param description Scene description
   */
  async generateBackground(sceneName: string, description: string): Promise<string> {
    console.log(`Generating background scene: ${sceneName}`);
    
    const prompt = `A detailed Aztec-themed background scene: ${description}. 
                    Suitable as a visual novel game background, expansive view, 
                    cinematic lighting, high-quality game art style, no characters.`;
                    
    const negativePrompt = "blurry, low quality, people, characters, text, watermark";
    
    // Use wider dimensions for backgrounds
    const request = this.buildImageRequest(prompt, negativePrompt, 1024, 576);  // 16:9 ratio
    const imageBase64 = await this.invokeModel(this.activeImageModelId, request);
    
    const outputPath = path.join(this.outputDir, `background-${sceneName.toLowerCase().replace(/\s+/g, '-')}.png`);
    await this.saveBase64Image(imageBase64, outputPath);
    
    return outputPath;
  }
  
  /**
   * Generate a game object or prop
   * @param objectName Name of the object
   * @param description Object description
   */
  async generateGameObject(objectName: string, description: string): Promise<string> {
    console.log(`Generating game object: ${objectName}`);
    
    const prompt = `A detailed Aztec-themed object: ${description}. 
                    Isolated on transparent background, isometric view, 
                    detailed textures, suitable for a game item, high quality.`;
                    
    const negativePrompt = "blurry, low quality, cluttered background, text, watermark";
    
    const request = this.buildImageRequest(prompt, negativePrompt, 512, 512);
    const imageBase64 = await this.invokeModel(this.activeImageModelId, request);
    
    const outputPath = path.join(this.outputDir, `object-${objectName.toLowerCase().replace(/\s+/g, '-')}.png`);
    await this.saveBase64Image(imageBase64, outputPath);
    
    return outputPath;
  }

  // Build request format based on the model (same as in bedrock-node-test.js)
  private buildImageRequest(prompt: string, negativePrompt: string, width = 512, height = 512) {
    const model = this.activeImageModelId || "";
    
    // For Stability AI models
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
    } 
    // For Amazon Titan models
    else if (model.startsWith("amazon.titan")) {
      return {
        textPrompt: prompt,
        negativePrompt: negativePrompt,
        width,
        height,
        quality: "standard",
        cfgScale: 7,
        seed: Math.floor(Math.random() * 1000000)
      };
    }
    // Default format (stability)
    else {
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

  // Invoke model and get response (same as in bedrock-node-test.js)
  private async invokeModel(modelId: string, requestData: any): Promise<string> {
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

  // Save base64 image to file (same as in bedrock-node-test.js)
  private async saveBase64Image(base64: string, outputPath: string): Promise<void> {
    try {
      const imageBuffer = Buffer.from(base64, 'base64');
      fs.writeFileSync(outputPath, imageBuffer);
      console.log(`✅ Image saved to: ${outputPath}`);
    } catch (error) {
      console.error('❌ Error saving image:', error);
      throw error;
    }
  }
}
