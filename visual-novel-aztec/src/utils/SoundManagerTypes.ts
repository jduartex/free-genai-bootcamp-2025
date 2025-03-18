// Common types for sound management to be imported by both modules
export interface SoundConfig {
  key: string;
  volume?: number;
  loop?: boolean;
}

export interface VoiceConfig {
  character: string;
  text: string;
  emotion?: string;
  languageCode?: string;
}
