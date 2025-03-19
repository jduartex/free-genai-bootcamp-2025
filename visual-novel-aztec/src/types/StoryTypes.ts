/**
 * Story data structure definitions
 */

/**
 * Word data with timing information for lip sync
 */
export interface WordData {
  word: string;
  start: number; // Start time in seconds
  end?: number;   // End time in seconds
}

/**
 * Vocabulary entry for Japanese words
 */
export interface VocabularyEntry {
  term: string;
  reading?: string;
  meaning: string;
  notes?: string;
  seen?: boolean;
  mastered?: boolean;
  examples?: string[];
  level?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
}

/**
 * Dialog choice option
 */
export interface DialogChoice {
  id: string;
  japanese: string;
  english: string;
  nextId: string;  // The ID to navigate to when selected
  puzzle_answer?: boolean;  // Whether this is the correct answer for a puzzle
  requires_item?: string;   // Item ID required to select this choice
  gives_item?: string;      // Item ID given when this choice is selected
}

/**
 * Dialog entry structure
 */
export interface DialogEntry {
  speakerId: string;
  japanese: string;
  english: string;
  default_next_id?: string;
  choices?: DialogChoice[];
  words?: WordData[];
  effect?: string;
  requires?: string[];
}

/**
 * Location data structure
 */
export interface Location {
  id: string;
  name: string;
  description: string;
  background: string;
  hotspots?: any[];
  objects?: any[];
}

/**
 * Story game state
 */
export interface GameState {
  currentSceneId: string;
  currentDialogId: string;
  inventory: string[];
  flags: Record<string, boolean>;
  visitedLocations: string[];
  timeRemaining: number;
  score: number;
  hintsUsed: number;
  vocabularySeen: string[];
}

/**
 * Complete story data structure
 */
export interface StoryData {
  id: string;
  title: string;
  author?: string;
  version?: string;
  language?: string;
  background?: string;
  location_id?: string;
  startsAt?: string;
  timer?: number;
  dialog?: Record<string, DialogEntry>;
  locations?: Record<string, Location>;
  vocabulary?: Record<string, VocabularyEntry>;
  scenes?: any[];
  initialState?: GameState;
}

/**
 * Character definition
 */
export interface Character {
  name: string;        // Character's display name
  portrait: string;    // Default portrait image
  variants?: Record<string, string>; // Emotion variants
  description?: string; // Character description
  voiceId?: string;    // Voice ID for speech synthesis
}

/**
 * Inventory item definition
 */
export interface Item {
  id: string;          // Item identifier
  name: string;        // Display name
  description: string; // Item description
  image: string;       // Item image
  usableIn?: string[]; // Scenes where this item can be used
}
