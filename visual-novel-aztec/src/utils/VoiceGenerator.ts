import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);

export class VoiceGenerator {
  private static polly: AWS.Polly;
  
  static initialize(): void {
    // Configure AWS SDK
    AWS.config.update({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.polly = new AWS.Polly();
  }
  
  /**
   * Generate voice for dialogue using Amazon Polly
   */
  static async generateVoiceForDialogue(
    dialogId: string, 
    text: string, 
    language: 'ja-JP' | 'en-US' = 'ja-JP',
    characterVoice: string = 'Takumi'
  ): Promise<string> {
    try {
      const params = {
        Engine: 'neural',
        LanguageCode: language,
        OutputFormat: 'mp3',
        SampleRate: '24000',
        Text: text,
        TextType: 'text',
        VoiceId: characterVoice
      };
      
      const data = await this.polly.synthesizeSpeech(params).promise();
      
      if (data.AudioStream instanceof Buffer) {
        const outputPath = path.resolve(__dirname, `../../public/assets/audio/dialogue/${dialogId}.mp3`);
        // Ensure directory exists
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        
        // Write audio file
        await writeFile(outputPath, data.AudioStream);
        
        return `assets/audio/dialogue/${dialogId}.mp3`;
      } else {
        throw new Error('Invalid audio data returned from Polly');
      }
    } catch (error) {
      console.error('Failed to generate voice:', error);
      throw error;
    }
  }
  
  /**
   * Map character IDs to appropriate voice IDs
   */
  static getVoiceForCharacter(characterId: string): string {
    const voiceMap: Record<string, string> = {
      'tlaloc': 'Takumi',    // Japanese male voice
      'citlali': 'Kazuha',   // Japanese female voice
      'diego': 'Sergio',     // Spanish male voice
      'narrator': 'Joanna'   // English female voice
    };
    
    return voiceMap[characterId] || 'Takumi';
  }
}
