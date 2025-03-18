/**
 * Centralized error handling utility
 * Provides consistent error handling across the game
 */

/**
 * Log an error with consistent formatting
 */
export function logError(context: string, error: any, additionalInfo?: any): void {
  console.error(`❌ [${context}] Error:`, error);
  if (additionalInfo) {
    console.error(`   Additional info:`, additionalInfo);
  }
}

/**
 * Log a warning with consistent formatting
 */
export function logWarning(context: string, message: string, additionalInfo?: any): void {
  console.warn(`⚠️ [${context}] Warning: ${message}`);
  if (additionalInfo) {
    console.warn(`   Additional info:`, additionalInfo);
  }
}

/**
 * Create a safe wrapper for any function that might throw
 * Returns a default value if the function throws
 */
export function safeExecute<T>(fn: () => T, defaultValue: T, errorContext: string): T {
  try {
    return fn();
  } catch (error) {
    logError(errorContext, error);
    return defaultValue;
  }
}

/**
 * Display error message to the user in-game
 */
export function showErrorToUser(scene: Phaser.Scene, message: string, duration: number = 3000): void {
  // Create a semi-transparent black background
  const bg = scene.add.rectangle(
    scene.cameras.main.width / 2,
    scene.cameras.main.height / 2,
    scene.cameras.main.width * 0.8,
    100,
    0x000000,
    0.7
  ).setOrigin(0.5);
  
  // Add error message text
  const text = scene.add.text(
    scene.cameras.main.width / 2,
    scene.cameras.main.height / 2,
    message,
    {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ff0000',
      align: 'center'
    }
  ).setOrigin(0.5);
  
  // Auto-remove after duration
  scene.time.delayedCall(duration, () => {
    bg.destroy();
    text.destroy();
  });
}

/**
 * Setup global error handlers for the game
 */
export function setupGlobalErrorHandlers(): void {
  if (typeof window !== 'undefined') {
    // Handle uncaught exceptions
    window.addEventListener('error', (event) => {
      logError('Uncaught Exception', event.error);
      return false; // Let default handler run
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      logError('Unhandled Promise Rejection', event.reason);
      return false; // Let default handler run
    });
    
    console.log('✅ Global error handlers configured');
  }
}

/**
 * Safely initialize game resources with fallbacks
 */
export function safeGameInit(scene: Phaser.Scene, callback: () => void): void {
  try {
    // Run the initialization code
    callback();
  } catch (error) {
    logError('Game Initialization', error);
    
    // Show error to user
    showErrorToUser(scene, 'Failed to initialize game resources. Please refresh the page.');
  }
}
