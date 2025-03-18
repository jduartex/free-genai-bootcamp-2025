/**
 * Types used for story content and dialog
 */

// Dialog entry in a scene
export interface DialogEntry {
  character: string;  // Character ID
  text: string;       // Text spoken
  emotion?: string;   // Optional emotion for character portrait
  translation?: string; // Optional Japanese/English translation
  choices?: DialogChoice[]; // Optional choices for player
}

// A player choice in a dialog
export interface DialogChoice {
  text: string;       // Text of the choice
  nextId?: string;    // ID of next dialog entry or scene (optional)
  condition?: string; // Conditional requirement (optional)
  effect?: string;    // Effect of choosing this option (optional)
}

// A scene in the story
export interface StoryScene {
  id: string;                // Scene identifier
  background: string;        // Background image
  music?: string;            // Background music (optional)
  ambience?: string;         // Ambient sounds (optional)
  initialDialog: string;     // ID of first dialog entry
  dialog: Record<string, DialogEntry>; // Map of dialog entries
}

// The entire story data structure
export interface StoryData {
  title: string;            // Title of the story
  author: string;           // Author name
  version: string;          // Version number
  language: string;         // Primary language
  scenes: StoryScene[];     // Array of scenes
  characters: Record<string, Character>; // Character definitions
  items: Record<string, Item>; // Inventory items
}

// Character definition
export interface Character {
  name: string;        // Character's display name
  portrait: string;    // Default portrait image
  variants?: Record<string, string>; // Emotion variants
  description?: string; // Character description
  voiceId?: string;    // Voice ID for speech synthesis
}

// Inventory item definition
export interface Item {
  id: string;          // Item identifier
  name: string;        // Display name
  description: string; // Item description
  image: string;       // Item image
  usableIn?: string[]; // Scenes where this item can be used
}
