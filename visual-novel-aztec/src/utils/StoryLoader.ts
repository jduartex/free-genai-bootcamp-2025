import { StoryData } from '../types/StoryTypes';

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
    const mappings = await mappingsResponse.json();
    StoryStore.mappings = mappings;

    // Load scene data
    const scenesList = ['scene001']; // Add more scenes as they become available
    
    for (const sceneName of scenesList) {
      const sceneResponse = await fetch(`/story/${sceneName}.json`);
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
 * Get a specific scene by ID
 */
export function getScene(sceneId: string): StoryData | undefined {
  return StoryStore.scenes.get(sceneId);
}

/**
 * Get character name from ID
 */
export function getCharacterName(characterId: string): string {
  return StoryStore.mappings.characterNames[characterId] || characterId;
}

/**
 * Get location name from ID
 */
export function getLocationName(locationId: string): string {
  return StoryStore.mappings.locations[locationId] || locationId;
}

/**
 * Save game progress to localStorage
 */
export function saveGameProgress(sceneId: string, dialogId: string, remainingTime: number): void {
  const saveData = {
    sceneId,
    dialogId,
    remainingTime,
    timestamp: Date.now()
  };
  
  localStorage.setItem('aztecEscape_saveGame', JSON.stringify(saveData));
}

/**
 * Load game progress from localStorage
 */
export function loadGameProgress(): { sceneId: string; dialogId: string; remainingTime: number } | null {
  const saveData = localStorage.getItem('aztecEscape_saveGame');
  if (!saveData) return null;
  
  try {
    return JSON.parse(saveData);
  } catch (error) {
    console.error('Error parsing save data:', error);
    return null;
  }
}
