import { BedrockService } from '../services/BedrockService';
import { AssetCache } from './AssetCache';

/**
 * UIGenerator - Creates game UI elements using AWS Bedrock
 */
export class UIGenerator {
  private static instance: UIGenerator;
  private bedrockService: BedrockService;
  private cache: AssetCache;
  
  private constructor() {
    this.bedrockService = BedrockService.getInstance();
    this.cache = new AssetCache();
  }
  
  public static getInstance(): UIGenerator {
    if (!UIGenerator.instance) {
      UIGenerator.instance = new UIGenerator();
    }
    return UIGenerator.instance;
  }
  
  /**
   * Generate a custom button based on a theme description
   * @param theme Description of the button theme (e.g., "Aztec stone button with glyphs")
   * @param label Button label text
   */
  public async generateButton(theme: string, label: string): Promise<string> {
    const cacheKey = `button_${theme}_${label}`;
    
    // Check cache first
    const cachedButton = this.cache.getItem(cacheKey);
    if (cachedButton) {
      console.log("Using cached button for:", theme);
      return cachedButton;
    }
    
    // Generate button image if not in cache
    const prompt = `A high-quality UI button with a ${theme} style. Clean, isometric view, suitable for a visual novel game. The button should complement an Aztec theme. No text on the button.`;
    const negativePrompt = "text, words, labels, blur, distortion, low quality, flat design";
    
    try {
      const buttonImageBase64 = await this.bedrockService.generateImage(
        prompt,
        negativePrompt,
        320, // Width - already a multiple of 64
        256  // Height - changed from 128 to 256 to meet minimum dimension requirement
      );
      
      // Cache the result
      this.cache.setItem(cacheKey, buttonImageBase64);
      
      return buttonImageBase64;
    } catch (error) {
      console.error("Failed to generate button:", error);
      // Return fallback (could be path to a default button image)
      return "assets/ui/default_button.png";
    }
  }
  
  /**
   * Generate a themed dialog box background
   * @param theme Description of the dialog theme
   */
  public async generateDialogBox(theme: string): Promise<string> {
    const cacheKey = `dialog_${theme}`;
    
    // Check cache first
    const cachedDialog = this.cache.getItem(cacheKey);
    if (cachedDialog) {
      console.log(`📦 Using cached dialog box for theme: ${theme}`);
      return cachedDialog;
    }
    
    console.log(`🔄 Generating dialog box for theme: ${theme}`);
    const prompt = `A beautiful dialog box for a visual novel game with a ${theme} aesthetic. The design should have empty space in the middle for text. Semi-transparent, elegant design with ${theme} ornaments and decorations around the border.`;
    const negativePrompt = "text, words, intrusive elements in the center, blur, low quality";
    
    try {
      const startTime = Date.now();
      console.log(`🔄 Calling Bedrock API to generate dialog box...`);
      
      const dialogBoxBase64 = await this.bedrockService.generateImage(
        prompt,
        negativePrompt,
        768, // Width - multiple of 64
        256  // Height - multiple of 64
      );
      
      const duration = Date.now() - startTime;
      console.log(`✅ Dialog box generation completed in ${duration}ms`);
      
      // Cache the result
      this.cache.setItem(cacheKey, dialogBoxBase64);
      
      return dialogBoxBase64;
    } catch (error) {
      console.error("❌ Failed to generate dialog box:", error);
      
      // Check if AWS credentials are missing
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.warn("⚠️ AWS credentials are missing. Please configure them in your .env file.");
      }
      
      // Return fallback with more specific path
      return "assets/ui/default_dialog.png";
    }
  }
  
  /**
   * Generate a themed background image
   */
  public async generateBackgroundImage(theme: string, scene: string): Promise<string> {
    const cacheKey = `background_${theme}_${scene}`;
    
    // Check cache first
    const cachedBackground = this.cache.getItem(cacheKey);
    if (cachedBackground) {
      return cachedBackground;
    }
    
    const prompt = `A detailed ${scene} scene with ${theme} aesthetic. Beautiful background for a visual novel game. Aztec setting with appropriate architecture and ambiance.`;
    const negativePrompt = "text, words, people, characters, blur, distortion";
    
    try {
      const backgroundBase64 = await this.bedrockService.generateImage(
        prompt,
        negativePrompt,
        1024, // Width - higher resolution for backgrounds
        576   // Height - 16:9 aspect ratio (must be multiple of 64)
      );
      
      // Cache the result
      this.cache.setItem(cacheKey, backgroundBase64);
      
      return backgroundBase64;
    } catch (error) {
      console.error("Failed to generate background:", error);
      return "assets/backgrounds/default.png";
    }
  }
  
  /**
   * Apply the generated image to a Phaser game object
   */
  public async applyImageToGameObject(
    scene: Phaser.Scene, 
    gameObject: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    imageBase64: string,
    textureKey: string
  ): Promise<void> {
    return new Promise((resolve) => {
      // Convert base64 to texture
      const image = new Image();
      image.onload = () => {
        scene.textures.addImage(textureKey, image);
        gameObject.setTexture(textureKey);
        resolve();
      };
      image.src = `data:image/png;base64,${imageBase64}`;
    });
  }
}
