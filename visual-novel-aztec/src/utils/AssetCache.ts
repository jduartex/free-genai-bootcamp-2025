/**
 * Cache for generated assets to reduce API calls
 */
export class AssetCache {
  private static instance: AssetCache;
  private cache: Map<string, string> = new Map();
  private maxCacheSize: number = 50;
  
  private constructor() {
    this.loadFromLocalStorage();
  }
  
  public static getInstance(): AssetCache {
    if (!AssetCache.instance) {
      AssetCache.instance = new AssetCache();
    }
    return AssetCache.instance;
  }
  
  /**
   * Get an asset from the cache
   */
  public get(key: string): string | undefined {
    return this.cache.get(key);
  }
  
  /**
   * Store an asset in the cache
   */
  public set(key: string, value: string): void {
    // Prune cache if it gets too large
    if (this.cache.size >= this.maxCacheSize) {
      // Fix: Add null check to handle potential undefined key
      const keyIterator = this.cache.keys();
      const firstKeyResult = keyIterator.next();
      
      if (!firstKeyResult.done && firstKeyResult.value) {
        this.cache.delete(firstKeyResult.value);
      }
    }
    
    this.cache.set(key, value);
    this.saveToLocalStorage();
  }
  
  /**
   * Save cache to localStorage
   */
  private saveToLocalStorage(): void {
    try {
      const cacheObj: Record<string, string> = {};
      this.cache.forEach((value, key) => {
        cacheObj[key] = value;
      });
      
      localStorage.setItem('aztecEscape_assetCache', JSON.stringify(cacheObj));
    } catch (error) {
      console.warn('Failed to save asset cache to localStorage:', error);
    }
  }
  
  /**
   * Load cache from localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const cachedData = localStorage.getItem('aztecEscape_assetCache');
      if (cachedData) {
        const cacheObj = JSON.parse(cachedData) as Record<string, string>;
        
        Object.entries(cacheObj).forEach(([key, value]) => {
          this.cache.set(key, value);
        });
      }
    } catch (error) {
      console.warn('Failed to load asset cache from localStorage:', error);
    }
  }
}
