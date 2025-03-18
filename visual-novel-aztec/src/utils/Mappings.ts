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
        loadedMappings.characterNames = { ...loadedMappings.characterNames, ...data.characterNames };
        loadedMappings.locations = { ...loadedMappings.locations, ...data.locations };
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

export const mappings = loadedMappings;
