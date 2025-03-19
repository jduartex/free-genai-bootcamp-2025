interface Mappings {
  characterNames: Record<string, string>;
  locations: Record<string, string>;
}

// Default mappings in case the file can't be loaded
const defaultMappings: Mappings = {
  characterNames: {
    'tlaloc': 'Tlaloc',
    'citlali': 'Citlali',
    'diego': 'Guard Diego',
    'narrator': 'Narrator'
  },
  locations: {
    'prison-cell': 'Spanish Prison Cell',
    'aztec-village': 'Aztec Village (Flashback)',
    'spanish-invasion': 'Spanish Invasion (Flashback)',
    'hidden-tunnel': 'Escape Tunnel'
  }
};

// Load mappings from the file
let loadedMappings: Mappings = { ...defaultMappings };

try {
  // In browser, we'll use default mappings first and then try to load dynamically
  
  // Try to load mappings dynamically if in browser
  if (typeof window !== 'undefined') {
    fetch('/mappings.json')
      .then(response => response.json())
      .then(data => {
        // Update mappings when loaded
        loadedMappings.characterNames = { ...loadedMappings.characterNames, ...(data.characterNames || {}) };
        loadedMappings.locations = { ...loadedMappings.locations, ...(data.locations || {}) };
        console.log('Loaded mappings:', loadedMappings);
      })
      .catch(error => {
        console.warn('Error loading mappings:', error);
      });
  }
} catch (e) {
  console.warn('Error initializing mappings:', e);
  loadedMappings = { ...defaultMappings };
}

// Export a function that guarantees a non-undefined result
export const mappings: Mappings = loadedMappings;

/**
 * Game asset mappings
 */

// Map location IDs to background image assets
export const BACKGROUND_MAPPINGS: Record<string, string> = {
  'prison': 'background-prison-cell',
  'temple': 'background-temple',
  'city': 'background-city',
  'default': 'background-temple'
};

// Map character IDs to character image assets
export const CHARACTER_MAPPINGS: Record<string, string> = {
  'tlaloc': 'character-priest',
  'citlali': 'character-priestess',
  'diego': 'character-warrior',
  'default': 'character-priest'
};

// Map voice actors to characters
export const VOICE_MAPPINGS: Record<string, string> = {
  'tlaloc': 'takumi',
  'citlali': 'kazuha',
  'diego': 'sergio',
  'narrator': 'joanna'
};
