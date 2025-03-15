/**
 * AssetCache - Caches generated assets to avoid redundant API calls
 */
export class AssetCache {
  private readonly cache: Map<string, string>;
  private readonly localStoragePrefix: string = 'aztec_game_asset_';
  
  constructor() {
    this.cache = new Map<string, string>();
    this.loadFromLocalStorage();
  }
  
  /**
   * Get an item from the cache
   */
  public getItem(key: string): string | undefined {
    return this.cache.get(key);
  }
  
  /**
   * Set an item in the cache
   */
  public setItem(key: string, value: string): void {
    this.cache.set(key, value);
    this.saveToLocalStorage(key, value);
  }
  
  /**
   * Remove an item from the cache
   */
  public removeItem(key: string): boolean {
    this.removeFromLocalStorage(key);
    return this.cache.delete(key);
  }
  
  /**
   * Clear the entire cache
   */
  public clear(): void {
    this.cache.clear();
    this.clearLocalStorage();
  }
  
  /**
   * Load assets from localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      // Get keys from localStorage that match our prefix
      const keys = Object.keys(localStorage).filter(
        key => key.startsWith(this.localStoragePrefix)
      );
      
      // Load each item into memory
      keys.forEach(fullKey => {
        const key = fullKey.replace(this.localStoragePrefix, '');
        const value = localStorage.getItem(fullKey);
        if (value) {
          this.cache.set(key, value);
        }
      });
      
      console.log(`Loaded ${keys.length} cached assets from localStorage`);
    } catch (error) {
      console.warn('Error loading assets from localStorage:', error);
    }
  }
  
  /**
   * Save an asset to localStorage
   */
  private saveToLocalStorage(key: string, value: string): void {
    try {
      localStorage.setItem(this.localStoragePrefix + key, value);
    } catch (error) {
      console.warn(`Could not save asset to localStorage: ${error}`);
      // Handle storage quota errors
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.pruneLocalStorage();
      }
    }
  }
  
  /**
   * Remove an asset from localStorage
   */
  private removeFromLocalStorage(key: string): void {
    try {
      localStorage.removeItem(this.localStoragePrefix + key);
    } catch (error) {
      console.warn(`Error removing ${key} from localStorage:`, error);
    }
  }
  
  /**
   * Clear all assets from localStorage
   */
  private clearLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage).filter(
        key => key.startsWith(this.localStoragePrefix)
      );
      
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
    }
  }
  
  /**
   * Clean up old items when storage quota is reached
   */
  private pruneLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage).filter(
        key => key.startsWith(this.localStoragePrefix)
      );
      
      // Remove oldest 25% of items
      const pruneCount = Math.ceil(keys.length * 0.25);
      const keysToRemove = keys.slice(0, pruneCount);
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        const cacheKey = key.replace(this.localStoragePrefix, '');
        this.cache.delete(cacheKey);
      });
      
      console.log(`Pruned ${keysToRemove.length} items from cache`);
    } catch (error) {
      console.error('Error pruning localStorage:', error);
    }
  }
}
