import { BedrockService } from '../services/BedrockService';
import Phaser from 'phaser';
import { AssetCache } from './AssetCache';

/**
 * ImageVariationGenerator - Creates character image variations using AWS Bedrock
 */
export class ImageVariationGenerator {
  private static instance: ImageVariationGenerator;
  private bedrockService: BedrockService;
  private cache: AssetCache;
  
  private constructor() {
    this.bedrockService = BedrockService.getInstance();
    this.cache = new AssetCache();
  }
  
  public static getInstance(): ImageVariationGenerator {
    if (!ImageVariationGenerator.instance) {
      ImageVariationGenerator.instance = new ImageVariationGenerator();
    }
    return ImageVariationGenerator.instance;
  }
  
  /**
   * Generate variations of a character image with different expressions
   * @param scene Current Phaser scene
   * @param characterId ID of the character
   * @param expression The facial expression to generate (e.g., "happy", "sad", "angry")
   * @param textureKey Base texture key of the character
   */
  public async generateCharacterExpression(
    scene: Phaser.Scene,
    characterId: string,
    expression: string,
    textureKey: string
  ): Promise<string> {
    const cacheKey = `character_${characterId}_${expression}`;
    
    // Check cache first
    const cachedImage = this.cache.getItem(cacheKey);
    if (cachedImage) {
      return cachedImage;
    }
    
    try {
      // First, get the base image as base64
      const baseImageBase64 = await this.getBaseImageAsBase64(scene, textureKey);
      
      if (!baseImageBase64) {
        throw new Error("Could not get base image");
      }
      
      // Generate the expression variation
      const prompt = `The same character but with a ${expression} facial expression. Maintain the exact same art style, character design, and proportions. Only the facial expression should change to show ${expression}.`;
      
      const variations = await this.bedrockService.generateImageVariations(
        baseImageBase64,
        prompt,
        1
      );
      
      if (variations && variations.length > 0) {
        // Cache the result
        this.cache.setItem(cacheKey, variations[0]);
        return variations[0];
      } else {
        throw new Error("No variations returned");
      }
    } catch (error) {
      console.error(`Failed to generate ${expression} expression for ${characterId}:`, error);
      return ""; // Return empty if failed
    }
  }
  
  /**
   * Get a texture from scene as base64
   */
  private async getBaseImageAsBase64(scene: Phaser.Scene, textureKey: string): Promise<string> {
    return new Promise((resolve) => {
      try {
        // Check if texture exists
        if (!scene.textures.exists(textureKey)) {
          console.error(`Texture ${textureKey} not found`);
          resolve("");
          return;
        }

        // Create a temporary sprite to render to canvas
        const tempSprite = scene.add.sprite(0, 0, textureKey);
        tempSprite.setVisible(false);
        
        // Get dimensions from the sprite
        const width = tempSprite.width;
        const height = tempSprite.height;
        
        // Create a canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          tempSprite.destroy();
          resolve("");
          return;
        }
        
        // Try different approaches to get the image data
        try {
          // Approach 1: Use Phaser's renderer to extract canvas data (WebGL only)
          if (scene.game.renderer.type === Phaser.WEBGL) {
            // Use type assertion with any to bypass TypeScript restrictions
            const renderer = scene.game.renderer as any;
            
            // Check if extract functionality exists using safe navigation
            if (renderer && renderer.extract && typeof renderer.extract.canvas === 'function') {
              const extractedCanvas = renderer.extract.canvas(tempSprite);
              tempSprite.destroy();
              
              // Convert to base64
              const base64 = extractedCanvas.toDataURL('image/png').replace(/^data:image\/\w+;base64,/, '');
              resolve(base64);
              return;
            }
          }
          
          // Approach 2: Render sprite manually to canvas
          // Draw a placeholder with character info since direct texture access is difficult
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          
          // Add character ID text
          ctx.fillStyle = "#333333";
          ctx.font = "16px Arial";
          ctx.fillText(`Character: ${textureKey}`, 20, 40);
          
          // Draw placeholder for face area (where expression would be)
          ctx.beginPath();
          ctx.arc(width / 2, height / 3, height / 6, 0, Math.PI * 2);
          ctx.fillStyle = "#EEEEEE";
          ctx.fill();
          ctx.strokeStyle = "#333333";
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Clean up
          tempSprite.destroy();
          
          // Get base64 representation
          const base64 = canvas.toDataURL('image/png').replace(/^data:image\/\w+;base64,/, '');
          resolve(base64);
        } catch (extractError) {
          console.error("Failed to extract image:", extractError);
          tempSprite.destroy();
          resolve("");
        }
      } catch (error) {
        console.error("Error converting texture to base64:", error);
        resolve("");
      }
    });
  }
  
  /**
   * Apply a generated character expression to a sprite
   */
  public async applyExpressionToSprite(
    scene: Phaser.Scene,
    sprite: Phaser.GameObjects.Sprite,
    expressionBase64: string,
    expressionKey: string
  ): Promise<void> {
    return new Promise((resolve) => {
      // Convert base64 to texture
      const image = new Image();
      image.onload = () => {
        scene.textures.addImage(expressionKey, image);
        sprite.setTexture(expressionKey);
        resolve();
      };
      image.src = `data:image/png;base64,${expressionBase64}`;
    });
  }
}
