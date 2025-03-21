export interface DialogWord {
  word: string;
  start: number;
  end: number;
}

export interface DialogChoice {
  english: string;
  japanese: string;
  next_id: string;
  puzzle_answer?: number;
}

export interface DialogEntry {
  speakerId: string;
  audio?: string;
  japanese: string;
  english: string;
  words?: DialogWord[];
  default_next_id?: string;
  choices?: DialogChoice[];
  ends?: boolean;
}

export interface VocabularyEntry {
  word: string;
  romaji: string;
  translation: string;
  usage: string;
  example: string;
}

export interface TimerConfig {
  initial: number;  // In seconds
  penalty: number;  // In seconds
}

export interface StoryData {
  id: string;
  title: string;
  location_id: string;
  character_id?: string;
  startsAt: string;
  timer?: TimerConfig;
  dialog: Record<string, DialogEntry>;
  vocabulary?: VocabularyEntry[];
}

export interface GameState {
  currentScene: string;
  currentDialog: string;
  remainingTime: number;
  collectedItems: string[];
  solvedPuzzles: string[];
  unlockedHints: string[];
}
