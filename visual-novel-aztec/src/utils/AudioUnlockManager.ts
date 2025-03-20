/**
 * Utility to handle unlocking audio context on various browsers
 */
export class AudioUnlockManager {
  private static _unlocked: boolean = false;
  private static _unlockAttempts: number = 0;
  
  /**
   * Try to unlock audio context
   * @param scene The Phaser scene to use for audio context
   * @returns True if audio was successfully unlocked or already unlocked
   */
  public static tryUnlockAudio(scene: Phaser.Scene): boolean {
    if (this._unlocked) {
      return true;
    }
    
    try {
      // Try to unlock Web Audio
      if (scene.sound && scene.sound.locked) {
        console.log('Attempting to unlock audio...');
        scene.sound.unlock();
        
        // Also play a silent sound to trigger audio unlock in Safari/iOS
        if (scene.cache.audio.exists('click')) {
          scene.sound.play('click', { volume: 0.01 });
        }
        
        this._unlockAttempts++;
        this._unlocked = !scene.sound.locked;
        
        console.log(`Audio unlock attempt ${this._unlockAttempts}: ${this._unlocked ? 'SUCCESS' : 'FAILED'}`);
        return this._unlocked;
      } else {
        // Audio system is not locked or doesn't exist
        this._unlocked = true;
        return true;
      }
    } catch (error) {
      console.error('Error unlocking audio:', error);
      return false;
    }
  }
  
  /**
   * Check if audio has been unlocked
   */
  public static isUnlocked(): boolean {
    return this._unlocked;
  }
  
  /**
   * Add an unlock button to a scene
   * @param scene The scene to add the unlock button to
   * @param x X position of the button
   * @param y Y position of the button
   */
  public static addUnlockButton(scene: Phaser.Scene, x: number = 50, y: number = 50): void {
    const button = scene.add.text(x, y, '🔊 Tap to Enable Audio', {
      backgroundColor: '#333333',
      padding: { x: 10, y: 5 },
      color: '#ffffff',
      fontSize: '18px'
    }).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.tryUnlockAudio(scene)) {
          button.setText('✅ Audio Enabled');
          scene.time.delayedCall(2000, () => {
            button.destroy();
          });
        } else {
          button.setText('❌ Failed - Try Again');
          scene.time.delayedCall(1000, () => {
            button.setText('🔊 Tap to Enable Audio');
          });
        }
      });
  }
}
