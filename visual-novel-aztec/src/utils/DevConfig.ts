/**
 * Configuration flags for development features
 */
export const DevConfig = {
  // Whether to use placeholder assets instead of real assets
  usePlaceholders: false,
  
  // Whether to show asset boundaries for debugging
  showAssetBounds: false,
  
  // Whether to log asset loading
  logAssetLoading: true,
  
  // Path prefix for asset loading
  assetPath: '/assets/',
  
  // Toggle to use local assets during development
  useLocalAssets: true,
  
  // Toggle between development and production assets
  useProductionAssets: false,
};

/**
 * Get the correct asset path based on configuration
 */
export function getAssetPath(category: string, assetName: string): string {
  // If using production assets, use a different path
  if (DevConfig.useProductionAssets) {
    return `${DevConfig.assetPath}production/${category}/${assetName}`;
  }
  
  // For local development
  if (DevConfig.useLocalAssets) {
    return `${DevConfig.assetPath}${category}/${assetName}`;
  }
  
  // Fallback to CDN or other source
  return `https://your-cdn.com/aztec-escape/assets/${category}/${assetName}`;
}
