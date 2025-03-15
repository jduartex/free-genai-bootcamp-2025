import Phaser from 'phaser';
import { loadStoryData } from '../utils/StoryLoader';
import { generatePlaceholders } from '../utils/PlaceholderGenerator';
import { SoundManager } from '../utils/SoundManager';

/**
 * Initial loading scene for the game
 * Loads core assets and transitions to PreloadScene
 */
export class LoadScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  
  constructor() {
    super({ key: 'LoadScene' });
  }
  
  preload(): void {
    // Create loading text in the center
    this.loadingText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'Loading Game...',
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // Create error text (hidden by default)
    const errorText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 40,
      '',
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ff0000'
      }
    ).setOrigin(0.5).setVisible(false);
    
    // Set up error handling
    this.load.on('loaderror', (file: any) => {
      console.error(`Failed to load asset: ${file.key}`, file);
      errorText.setText(`Error loading: ${file.key}`);
      errorText.setVisible(true);
    });
    
    // Create empty sounds first to prevent errors
    this.createEmptySounds();
    
    // Load minimum required assets for the PreloadScene
    this.load.image('logo', 'assets/logo.png');
    
    // Generic icons for UI elements
    this.load.image('button-placeholder', 'assets/ui/default_button.png');
    this.load.image('dialog-box-placeholder', 'assets/ui/default_dialog.png');
    this.load.image('character-placeholder', 'assets/characters/narrator.png');
  }
  
  create(): void {
    // Add logo if available
    if (this.textures.exists('logo')) {
      const logo = this.add.image(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2 - 100,
        'logo'
      ).setOrigin(0.5);
      
      // Add fade-in animation
      logo.setAlpha(0);
      this.tweens.add({
        targets: logo,
        alpha: 1,
        duration: 1000,
        ease: 'Power2'
      });
    }
    
    // Add animated ellipsis to loading text
    let dots = '';
    const ellipsisTimer = this.time.addEvent({
      delay: 500,
      callback: () => {
        dots = dots.length < 3 ? dots + '.' : '';
        this.loadingText.setText(`Loading Game${dots}`);
      },
      callbackScope: this,
      loop: true
    });
    
    // Wait a short time then proceed to next scene
    this.time.delayedCall(1500, () => {
      ellipsisTimer.destroy();
      this.scene.start('PreloadScene');
    });
  }
  
  // Create silent audio placeholders for all sound effects we'll need
  private createEmptySounds(): void {
    const audioKeys = [
      'click', 'hover', 'success', 'fail', 'unlock', 'theme',
      'warning', 'pickup', 'village-ambience', 'battle-ambience',
      'tunnel-ambience', 'prison-ambience'
    ];
    
    try {
      // Create fallback audio elements for each key
      audioKeys.forEach(key => {
        try {
          // Check if already registered
          if (!this.sound.get(key)) {
            // Create an "empty" sound with a base64 silent MP3
            const silentBase64 = "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADQgD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwAQAAAAAAAAAAABSAJAJAQgAAgAAAA0L2YLwxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
            
            // Add to cache directly via DataURI
            if (!this.cache.audio.exists(key)) {
              // Create a silent sound using a data URL
              const silentAudioURL = `data:audio/mp3;base64,${silentBase64}`;
              
              // Add it to the loader - this is async but better than nothing
              this.load.audio(key, silentAudioURL);
            }
            
            // Preemptively add to sound manager
            try {
              this.sound.add(key, { volume: 0 });
            } catch (e) {
              // Ignore errors here, will retry later
            }
          }
        } catch (error) {
          console.warn(`Failed to create placeholder sound: ${key}`, error);
        }
      });
      
      // Start the loader to process these files
      if (this.load.list.size > 0) {
        this.load.once('complete', () => {
          console.log("All placeholder sounds processed");
        });
        this.load.start(); 
      }
      
      console.log("Placeholder sounds setup complete");
    } catch (error) {
      console.warn("Audio initialization failed:", error);
    }
  }
}
