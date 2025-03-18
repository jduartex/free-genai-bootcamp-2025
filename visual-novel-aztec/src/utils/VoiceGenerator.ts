/**
 * Voice Generator Utility
 * Provides text-to-speech generation for dialogue
 */

// Define character voice types
interface VoiceConfig {
  name: string;
  gender: 'male' | 'female' | 'neutral';
  pitch: number;
  rate: number;
  language: string;
  variant?: string;
}

/**
 * Class to manage voice generation for dialogue
 */
export class VoiceGenerator {
  // Static instance for singleton pattern
  private static instance: VoiceGenerator | null = null;
  
  // Static mapping of voices
  public static readonly voices: Record<string, VoiceConfig> = {
    'narrator': {
      name: 'Narrator',
      gender: 'neutral',
      pitch: 1.0,
      rate: 0.9,
      language: 'ja-JP'
    },
    'tlaloc': {
      name: 'Tlaloc',
      gender: 'male',
      pitch: 0.8,
      rate: 0.95,
      language: 'ja-JP'
    },
    'citlali': {
      name: 'Citlali',
      gender: 'female',
      pitch: 1.2,
      rate: 1.0,
      language: 'ja-JP'
    },
    'diego': {
      name: 'Diego',
      gender: 'male',
      pitch: 0.9,
      rate: 0.85,
      language: 'ja-JP'
    }
  };

  // Cache for generated voices
  private voiceCache: Map<string, string> = new Map();
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.voiceCache = new Map();
    console.log('VoiceGenerator initialized');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): VoiceGenerator {
    if (!VoiceGenerator.instance) {
      VoiceGenerator.instance = new VoiceGenerator();
    }
    return VoiceGenerator.instance;
  }

  /**
   * Get voice configuration for a character
   * @param characterId The character ID
   * @returns Voice configuration for the character
   */
  public static getVoiceForCharacter(characterId: string): VoiceConfig {
    if (characterId in VoiceGenerator.voices) {
      return VoiceGenerator.voices[characterId];
    }
    // Default to narrator if character not found
    return VoiceGenerator.voices.narrator;
  }

  /**
   * Generate a voice file for dialogue
   * @param dialogId The dialogue ID
   * @param text The text to generate voice for
   * @returns Path to the generated voice file
   */
  public static generateVoiceFile(dialogId: string, text: string): string {
    try {
      // This would normally call a Text-to-Speech API
      // For now, we'll just return a placeholder path
      const safePath = `assets/audio/dialogue/generated/${dialogId}.mp3`;
      console.log(`Voice would be generated for: ${dialogId}`);
      return safePath;
    } catch (error) {
      console.error('Error generating voice file:', error);
      return `assets/audio/dialogue/fallback.mp3`;
    }
  }

  /**
   * Generate a voice for a specific dialogue
   * @param dialogId The dialogue ID
   * @param text The text to generate voice for
   * @param language The language code (e.g., 'ja-JP')
   * @param voiceConfig Voice configuration
   * @returns Promise resolving to the path of the generated audio
   */
  public static async generateVoiceForDialogue(
    dialogId: string,
    text: string,
    language: string = 'ja-JP',
    voiceConfig: VoiceConfig = VoiceGenerator.voices.narrator
  ): Promise<string> {
    // Get instance for cache access
    const instance = VoiceGenerator.getInstance();
    
    // Check cache first
    const cacheKey = `${dialogId}-${language}`;
    if (instance.voiceCache.has(cacheKey)) {
      return instance.voiceCache.get(cacheKey)!;
    }
    
    try {
      // In a real implementation, this would call an actual TTS API
      // For now, we're just returning a placeholder path
      const generatedPath = `assets/audio/dialogue/${dialogId}.mp3`;
      
      // Cache the result
      instance.voiceCache.set(cacheKey, generatedPath);
      
      return generatedPath;
    } catch (error) {
      console.error('Error generating voice:', error);
      return `assets/audio/dialogue/fallback.mp3`;
    }
  }

  /**
   * Speak text using the browser's speech synthesis API (for testing)
   * @param text Text to speak
   * @param voiceConfig Voice configuration
   */
  public static speakText(text: string, voiceConfig: VoiceConfig = VoiceGenerator.voices.narrator): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Speech synthesis not supported in this environment');
      return;
    }
    
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voiceConfig.language;
      utterance.rate = voiceConfig.rate;
      utterance.pitch = voiceConfig.pitch;
      
      // Try to find a matching voice
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(v => 
        v.lang.includes(voiceConfig.language) && 
        ((voiceConfig.gender === 'female' && v.name.includes('Female')) ||
         (voiceConfig.gender === 'male' && v.name.includes('Male')))
      );
      
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  }
}

// Add to window for global access if in browser environment
if (typeof window !== 'undefined') {
  (window as any).VoiceGenerator = VoiceGenerator;
}
