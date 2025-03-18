"use strict";
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Voice generator for AWS Polly integration
export const NodeVoiceGenerator = {
  client: null,
  
  // Map of voices that support the neural engine
  neuralVoices: [
    'Amy', 'Emma', 'Brian', 'Aria', 'Ayanda', 'Arlet', 'Hannah', 
    'Arthur', 'Daniel', 'Liam', 'Olivia', 'Ruth', 'Stephen', 'Ida',
    'John', 'Kevin', 'Matthew', 'Joanna', 'Kendra', 'Kimberly', 
    'Salli', 'Joey', 'Justin', 'Gregory', 'Adriano', 'Hiujin',
    'Laura', 'Lupe', 'Pedro', 'Remi', 'Elin', 'Kazuha', 'Tomoko'
  ],
  
  initialize: function() {
    const region = process.env.AWS_REGION || 'us-east-1';
    this.client = new PollyClient({ region });
    
    // Create output directory if it doesn't exist
    const audioOutputDir = path.join(__dirname, '../assets/audio');
    if (!fs.existsSync(audioOutputDir)) {
      fs.mkdirSync(audioOutputDir, { recursive: true });
    }
  },
  
  getVoiceForCharacter: function(character) {
    // Map characters to appropriate voices that support neural engine
    const characterVoices = {
      'tlaloc': 'Takumi', // Japanese male
      'citlali': 'Kazuha', // Japanese female (supports neural)
      'diego': 'Pedro',   // Spanish male (supports neural)
      'default': 'Joanna' // English (supports neural)
    };
    
    return characterVoices[character] || characterVoices.default;
  },
  
  generateVoiceForDialogue: async function(id, text, language = 'ja-JP', voice) {
    // Initialize client if not already done
    if (!this.client) {
      this.initialize();
    }
    
    // Set up output paths
    const audioOutputDir = path.join(__dirname, '../assets/audio');
    const outputPath = path.join(audioOutputDir, `${id}.mp3`);
    
    // Check if file already exists to avoid regeneration
    if (fs.existsSync(outputPath)) {
      console.log(`Audio already exists for ${id}, skipping generation`);
      return outputPath;
    }
    
    try {
      // Determine if we can use neural engine for this voice
      const engine = this.neuralVoices.includes(voice) ? "neural" : "standard";
      console.log(`Using ${engine} engine for voice: ${voice}`);
      
      const params = {
        Engine: engine,
        LanguageCode: language,
        OutputFormat: "mp3",
        Text: text,
        TextType: "text",
        VoiceId: voice
      };
      
      const command = new SynthesizeSpeechCommand(params);
      const response = await this.client.send(command);
      
      // Save audio
      if (response.AudioStream) {
        const buffer = Buffer.from(await response.AudioStream.transformToByteArray());
        fs.writeFileSync(outputPath, buffer);
        return outputPath;
      } else {
        throw new Error('No AudioStream in response');
      }
    } catch (error) {
      console.error('Error generating voice:', error);
      throw error;
    }
  }
};

// For backward compatibility
export default NodeVoiceGenerator;
