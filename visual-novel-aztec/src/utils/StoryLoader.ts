import { StoryData } from '../types/StoryTypes';

// Store loaded scenes in memory
const loadedScenes: Record<string, StoryData> = {};
const defaultStory: StoryData = {
  id: 'default',
  title: 'Default Story',
  location_id: 'prison-cell',
  startsAt: '000', // Add the missing startsAt property
  timer: {
    initial: 1800, // 30 minutes
    penalty: 60,    // 1 minute penalty
    warning: 300    // 5 minute warning
  },
  dialog: {
    '000': {
      speakerId: 'narrator',
      japanese: 'ゲームの始まり。',
      english: 'The beginning of the game.',
      default_next_id: '001'
    }
  }
};

// Global store for story data
export const StoryStore = {
  scenes: new Map<string, StoryData>(),
  mappings: {
    characterNames: {} as Record<string, string>,
    locations: {} as Record<string, string>
  }
};

/**
 * Load all story data from JSON files
 */
export async function loadStoryData(): Promise<void> {
  try {
    // Load mappings first
    const mappingsResponse = await fetch('/story/mappings.json');
    if (!mappingsResponse.ok) {
      throw new Error(`Failed to load mappings: ${mappingsResponse.statusText}`);
    }
    const mappings = await mappingsResponse.json();
    StoryStore.mappings = mappings;

    // Load scene data
    const scenesList = ['scene001']; // Add more scenes as they become available
    
    for (const sceneName of scenesList) {
      const sceneResponse = await fetch(`/story/${sceneName}.json`);
      if (!sceneResponse.ok) {
        throw new Error(`Failed to load scene ${sceneName}: ${sceneResponse.statusText}`);
      }
      const sceneData = await sceneResponse.json();
      StoryStore.scenes.set(sceneName, sceneData);
    }
    
    console.log('Story data loaded successfully');
    return Promise.resolve();
  } catch (error) {
    console.error('Error loading story data:', error);
    return Promise.reject(error);
  }
}

/**
 * Load a scene by ID
 * @param sceneId - The scene ID to load
 * @returns The scene data or undefined if not found
 */
export function getScene(sceneId: string): StoryData | undefined {
  if (loadedScenes[sceneId]) {
    return loadedScenes[sceneId];
  }

  try {
    // For browser environments, try to fetch the story file
    if (typeof fetch !== 'undefined') {
      // Return the default story while loading (prevents loading screens)
      setTimeout(() => {
        fetchScene(sceneId);
      }, 100);
      return defaultStory;
    }
  } catch (error) {
    console.error(`Error loading scene: ${sceneId}`, error);
  }

  return undefined;
}

/**
 * Get character name based on character ID
 * @param characterId - The character ID
 * @returns The character name
 */
export function getCharacterName(characterId: string): string {
  const mappings: Record<string, string> = {
    tlaloc: "Tlaloc",
    citlali: "Citlali", 
    diego: "Guard Diego",
    narrator: "Narrator"
  };
  
  return characterId in mappings ? mappings[characterId as keyof typeof mappings] : characterId;
}

/**
 * Get location name based on location ID
 * @param locationId - The location ID
 * @returns The location name
 */
export function getLocationName(locationId: string): string {
  const mappings: Record<string, string> = {
    'prison-cell': "Spanish Prison Cell",
    'aztec-village': "Aztec Village (Flashback)",
    'spanish-invasion': "Spanish Invasion (Flashback)",
    'hidden-tunnel': "Escape Tunnel"
  };
  
  return locationId in mappings ? mappings[locationId as keyof typeof mappings] : locationId;
}

/**
 * Save game progress locally
 * @param sceneId - The current scene ID
 * @param dialogId - The current dialog ID
 * @param remainingTime - The remaining time in seconds
 */
export function saveGameProgress(sceneId: string, dialogId: string, remainingTime: number): void {
  try {
    const saveData = {
      sceneId,
      dialogId,
      remainingTime,
      timestamp: Date.now()
    };
    
    // Save to localStorage if available
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('aztecEscape_saveData', JSON.stringify(saveData));
      console.log('Game progress saved:', saveData);
    }
  } catch (error) {
    console.warn('Failed to save game progress:', error);
  }
}

/**
 * Fetch scene data asynchronously
 */
async function fetchScene(sceneId: string): Promise<void> {
  try {
    // Add timeout to prevent hanging indefinitely
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`/story/${sceneId}.json`, { 
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      loadedScenes[sceneId] = data as StoryData;
      console.log(`Scene ${sceneId} loaded:`, data);
    } else {
      console.error(`Failed to load scene ${sceneId}: ${response.status}`);
      throw new Error(`HTTP error ${response.status}`);
    }
  } catch (error) {
    console.error(`Error fetching scene ${sceneId}:`, error);
    
    // Create a minimal fallback scene to prevent game from breaking completely
    if (!loadedScenes[sceneId]) {
      loadedScenes[sceneId] = {
        id: sceneId,
        title: `Error Loading Scene ${sceneId}`,
        background: 'error-background',
        location_id: 'error',
        startsAt: 'error',
        dialog: {
          'error': {
            speakerId: 'system',
            japanese: 'エラーが発生しました。シーンをロードできませんでした。',
            english: 'An error occurred. Could not load the scene.',
            default_next_id: 'error'
          }
        }
      } as StoryData;
    }
  }
}

/**
 * Load game progress from localStorage
 */
export function loadGameProgress(): { sceneId: string; dialogId: string; remainingTime: number } | null {
  try {
    const saveData = localStorage.getItem('aztecEscape_saveGame');
    if (!saveData) return null;
    
    const parsedData = JSON.parse(saveData) as { 
      sceneId: string; 
      dialogId: string; 
      remainingTime: number;
      timestamp?: number;
    };
    
    // Validate the parsed data has the expected properties
    if (!parsedData.sceneId || !parsedData.dialogId || typeof parsedData.remainingTime !== 'number') {
      console.error('Save data is missing required properties');
      return null;
    }
    
    // If save data is too old (more than 7 days), ignore it
    if (parsedData.timestamp && Date.now() - parsedData.timestamp > 7 * 24 * 60 * 60 * 1000) {
      console.warn('Save data is too old, ignoring');
      return null;
    }
    
    return {
      sceneId: parsedData.sceneId,
      dialogId: parsedData.dialogId,
      remainingTime: parsedData.remainingTime
    };
  } catch (error) {
    console.error('Error parsing save data:', error);
    return null;
  }
}

type SceneData = {
  characters?: Record<string, any>;
  locations?: Record<string, any>;
  dialogues?: Record<string, any>;
  // Add other properties as needed
};

/**
 * StoryLoader class responsible for loading and managing story data
 */
export class StoryLoader {
  // Properly declare instance properties
  private _scenes: Record<string, SceneData>;
  private _characters: Record<string, string>;
  private _locations: Record<string, string>;
  
  constructor() {
    // Initialize properties with default values
    this._scenes = {};
    this._characters = {
      tlaloc: 'tlaloc',
      citlali: 'citlali',
      diego: 'diego',
      narrator: 'narrator'
    };
    this._locations = {
      'prison-cell': 'prison-cell',
      'aztec-village': 'aztec-village',
      'spanish-invasion': 'spanish-invasion',
      'hidden-tunnel': 'hidden-tunnel'
    };
  }
  
  /**
   * Get scene data by ID
   * @param sceneId - The ID of the scene to retrieve
   * @returns The scene data for the specified ID
   */
  public getSceneData(sceneId: string): SceneData {
    return this._scenes[sceneId] || {};
  }
  
  /**
   * Get character image path by ID
   * @param characterId - The character ID
   * @returns The image path for the character
   */
  public getCharacterImage(characterId: string): string {
    return this._characters[characterId] || '';
  }
  
  /**
   * Get location image path by ID
   * @param locationId - The location ID
   * @returns The image path for the location
   */
  public getLocationImage(locationId: string): string {
    return this._locations[locationId] || '';
  }
  
  /**
   * Get puzzle data for the current scene and dialog
   * @param sceneId - The scene ID
   * @param dialogId - The dialog ID
   * @param remainingTime - The remaining time in seconds
   * @returns Puzzle data or null if no puzzle exists
   */
  public getPuzzle(sceneId: string, dialogId: string, remainingTime: number): any {
    return null;
  }
  
  /**
   * Load a scene by ID
   * @param sceneId - The scene ID to load
   * @returns Promise that resolves with the scene data
   */
  public loadScene(sceneId: string): Promise<SceneData> {
    return Promise.resolve(this._scenes[sceneId] || {});
  }
  
  /**
   * Get access to the scenes property
   */
  get scenes(): Record<string, SceneData> {
    return this._scenes;
  }
  
  /**
   * Get access to the characters property
   */
  get characters(): Record<string, string> {
    return this._characters;
  }
  
  /**
   * Get access to the locations property
   */
  get locations(): Record<string, string> {
    return this._locations;
  }
}
