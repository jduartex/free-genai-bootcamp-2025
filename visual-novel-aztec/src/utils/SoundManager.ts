import Phaser from 'phaser';

// Define interfaces for sound categories and options
interface SoundOptions {
    volume?: number;
    loop?: boolean;
    rate?: number;
    detune?: number;
}

interface SoundVolumes {
    master: number;
    music: number;
    effect: number;
    voice: number;
}

/**
 * Singleton class for managing audio across the game
 */
export class SoundManager {
    // Static instance for singleton pattern
    private static instance: SoundManager | null = null;
    
    // Instance properties
    private scene: Phaser.Scene | null;
    private sounds: Map<string, Phaser.Sound.BaseSound>;
    private enabled: boolean;
    private audioUnlocked: boolean;
    private volumes: SoundVolumes;
    
    // Track sounds by category for volume control
    private musicSounds: Set<string>;
    private effectSounds: Set<string>;
    private voiceSounds: Set<string>;

    // Ensure all properties are declared and initialized
    constructor() {
        this.scene = null;
        this.sounds = new Map();
        this.enabled = true;
        this.audioUnlocked = false;
        this.volumes = {
            master: 1.0,
            music: 0.7,
            effect: 0.8,
            voice: 1.0
        };
        this.musicSounds = new Set();
        this.effectSounds = new Set();
        this.voiceSounds = new Set();
        this.loadSavedVolumes();
    }

    /**
     * Get the singleton instance
     */
    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    /**
     * Initialize with a Phaser scene
     * @param scene The Phaser scene to use for audio
     */
    public init(scene: Phaser.Scene): void {
        if (this.scene !== scene) {
            this.scene = scene;
            
            // Set up audio unlock listeners if needed
            if (!this.audioUnlocked) {
                this.setupUnlockListeners();
            }
        }
    }

    /**
     * Load audio file
     * @param key The key to reference the audio
     * @param url The URL or path to the audio file
     * @returns Promise that resolves when the audio is loaded
     */
    public loadAudio(key: string, url: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!this.scene) {
                reject(new Error('Scene not initialized'));
                return;
            }
            
            if (this.scene.cache.audio.exists(key)) {
                resolve();
                return;
            }
            
            this.scene.load.audio(key, url);
            this.scene.load.once('complete', () => {
                resolve();
            });
            this.scene.load.once('loaderror', () => {
                reject(new Error(`Failed to load audio: ${key} from ${url}`));
            });
            this.scene.load.start();
        });
    }

    /**
     * Load multiple audio files
     * @param files Map of audio keys to paths
     * @returns Promise that resolves when all files are loaded
     */
    public loadAudioFiles(files: Record<string, string>): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!this.scene) {
                reject(new Error('Scene not initialized'));
                return;
            }
            
            // Add all files to the loader
            Object.entries(files).forEach(([key, url]) => {
                this.scene!.load.audio(key, url);
            });
            
            this.scene.load.once('complete', () => {
                resolve();
            });
            
            this.scene.load.once('loaderror', (fileObj: { key: string }) => {
                reject(new Error(`Failed to load audio: ${fileObj.key}`));
            });
            
            this.scene.load.start();
        });
    }

    /**
     * Check if audio is available
     */
    public isAudioAvailable(): boolean {
        return !!this.scene && !this.scene.sound.locked && this.enabled;
    }

    /**
     * Play a sound with volume scaling and automatic category handling
     * @param key The key of the sound to play
     * @param options Sound options
     * @returns The played sound or undefined if failed
     */
    public playSound(key: string, options: SoundOptions = {}): Phaser.Sound.BaseSound | undefined {
        try {
            if (!this.enabled || !this.scene?.sound || !this.scene?.cache?.audio?.exists(key)) {
                return undefined;
            }
            
            // Create or get the sound
            let sound = this.sounds.get(key);
            if (!sound) {
                sound = this.scene.sound.add(key);
                this.sounds.set(key, sound);
            }
            
            // Apply appropriate volume
            let scaledVolume = options.volume || 1.0;
            
            // Apply category-specific volume scaling
            if (this.musicSounds.has(key)) {
                scaledVolume *= this.volumes.music;
            } else if (this.voiceSounds.has(key)) {
                scaledVolume *= this.volumes.voice;
            } else if (this.effectSounds.has(key)) {
                scaledVolume *= this.volumes.effect;
            }
            
            // Apply master volume
            scaledVolume *= this.volumes.master;
            
            // Default values
            const playOptions = {
                ...options,
                volume: scaledVolume,
                loop: options.loop || false,
            };
            
            // Play the sound
            if (this.scene.sound.locked) {
                this.scene.sound.once('unlocked', () => {
                    sound!.play(playOptions);
                });
            } else {
                sound.play(playOptions);
            }
            
            return sound;
        } catch (error) {
            console.error(`Error in playSound for "${key}":`, error);
            return undefined;
        }
    }

    /**
     * Play music with automatic categorization
     * @param key The key of the music to play
     * @param options Sound options
     */
    public playMusic(key: string, options: SoundOptions = {}): Phaser.Sound.BaseSound | undefined {
        // Add to music category
        this.musicSounds.add(key);
        
        // Default to looping for music
        return this.playSound(key, {
            loop: true,
            ...options,
            volume: options.volume !== undefined ? options.volume : 1.0
        });
    }

    /**
     * Stop all sounds
     */
    public stopAll(): void {
        this.enabled = false;
        this.sounds.forEach(sound => {
            if (sound.isPlaying) {
                sound.stop();
            }
        });
    }

    /**
     * Stop music
     */
    public stopMusic(): void {
        this.musicSounds.forEach(key => {
            const sound = this.sounds.get(key);
            if (sound && sound.isPlaying) {
                sound.stop();
            }
        });
    }
    
    /**
     * Stop effects
     */
    public stopEffects(): void {
        this.effectSounds.forEach(key => {
            const sound = this.sounds.get(key);
            if (sound && sound.isPlaying) {
                sound.stop();
            }
        });
    }
    
    /**
     * Stop voice
     */
    public stopVoice(): void {
        this.voiceSounds.forEach(key => {
            const sound = this.sounds.get(key);
            if (sound && sound.isPlaying) {
                sound.stop();
            }
        });
    }

    /**
     * Set master volume
     * @param volume Volume from 0 to 1
     */
    public setMasterVolume(volume: number): void {
        this.volumes.master = Math.max(0, Math.min(1, volume));
        
        // Update all currently playing sounds
        this.updateAllSoundVolumes();
        
        // Save to localStorage
        this.saveVolumes();
    }
    
    /**
     * Set music volume
     * @param volume Volume from 0 to 1
     */
    public setMusicVolume(volume: number): void {
        this.volumes.music = Math.max(0, Math.min(1, volume));
        
        // Update music sounds
        this.updateSoundCategoryVolumes('music');
        
        // Save to localStorage
        this.saveVolumes();
    }
    
    /**
     * Set effect volume
     * @param volume Volume from 0 to 1
     */
    public setEffectVolume(volume: number): void {
        this.volumes.effect = Math.max(0, Math.min(1, volume));
        
        // Update effect sounds
        this.updateSoundCategoryVolumes('effect');
        
        // Save to localStorage
        this.saveVolumes();
    }
    
    /**
     * Set voice volume
     * @param volume Volume from 0 to 1
     */
    public setVoiceVolume(volume: number): void {
        this.volumes.voice = Math.max(0, Math.min(1, volume));
        
        // Update voice sounds
        this.updateSoundCategoryVolumes('voice');
        
        // Save to localStorage
        this.saveVolumes();
    }

    /**
     * Update volumes for a specific sound category
     * @param category The sound category to update
     */
    private updateSoundCategoryVolumes(category: keyof SoundVolumes): void {
        // Get the relevant sound set
        let soundSet: Set<string>;
        
        if (category === 'music') {
            soundSet = this.musicSounds;
        } else if (category === 'effect') {
            soundSet = this.effectSounds;
        } else if (category === 'voice') {
            soundSet = this.voiceSounds;
        } else {
            return; // Unknown category
        }
        
        // For currently playing sounds, we need to stop and replay with new volume
        soundSet.forEach(key => {
            const sound = this.sounds.get(key);
            if (sound && sound.isPlaying) {
                // Cast to WebAudioSound or HTML5AudioSound
                const webAudioSound = sound as Phaser.Sound.WebAudioSound;
                const html5AudioSound = sound as Phaser.Sound.HTML5AudioSound;

                // Store current position and playing state
                const currentSeek = webAudioSound.seek || html5AudioSound.seek || 0;
                const wasLooping = webAudioSound.loop || html5AudioSound.loop || false;

                // Stop the sound
                sound.stop();

                // Replay with new volume
                sound.play({
                    volume: this.volumes[category] * this.volumes.master,
                    loop: wasLooping
                });

                // Restore position if needed
                if (currentSeek > 0) {
                    if (webAudioSound.setSeek) {
                        webAudioSound.setSeek(currentSeek);
                    } else if (html5AudioSound.setSeek) {
                        html5AudioSound.setSeek(currentSeek);
                    }
                }
            }
        });
    }

    /**
     * Update all sound volumes based on current volume settings
     */
    private updateAllSoundVolumes(): void {
        // Update each category
        this.updateSoundCategoryVolumes('music');
        this.updateSoundCategoryVolumes('effect');
        this.updateSoundCategoryVolumes('voice');
        
        // Update any uncategorized sounds with master volume only
        this.sounds.forEach((sound, key) => {
            if (!this.musicSounds.has(key) && 
                !this.effectSounds.has(key) && 
                !this.voiceSounds.has(key) &&
                sound.isPlaying) {

                // Cast to WebAudioSound or HTML5AudioSound
                const webAudioSound = sound as Phaser.Sound.WebAudioSound;
                const html5AudioSound = sound as Phaser.Sound.HTML5AudioSound;

                // Store current position and playing state
                const currentSeek = webAudioSound.seek || html5AudioSound.seek || 0;
                const wasLooping = webAudioSound.loop || html5AudioSound.loop || false;

                // Stop the sound
                sound.stop();

                // Replay with new volume
                sound.play({
                    volume: this.volumes.master,
                    loop: wasLooping
                });

                // Restore position if needed
                if (currentSeek > 0) {
                    if (webAudioSound.setSeek) {
                        webAudioSound.setSeek(currentSeek);
                    } else if (html5AudioSound.setSeek) {
                        html5AudioSound.setSeek(currentSeek);
                    }
                }
            }
        });
    }

    /**
     * Save volume settings to localStorage
     */
    private saveVolumes(): void {
        try {
            localStorage.setItem('aztecEscape_volume_master', this.volumes.master.toString());
            localStorage.setItem('aztecEscape_volume_music', this.volumes.music.toString());
            localStorage.setItem('aztecEscape_volume_effect', this.volumes.effect.toString());
            localStorage.setItem('aztecEscape_volume_voice', this.volumes.voice.toString());
        } catch (error) {
            console.warn('Error saving volumes to localStorage:', error);
        }
    }
    
    /**
     * Load volume settings from localStorage
     */
    private loadSavedVolumes(): void {
        try {
            const master = localStorage.getItem('aztecEscape_volume_master');
            const music = localStorage.getItem('aztecEscape_volume_music');
            const effect = localStorage.getItem('aztecEscape_volume_effect');
            const voice = localStorage.getItem('aztecEscape_volume_voice');
            
            if (master) this.volumes.master = parseFloat(master);
            if (music) this.volumes.music = parseFloat(music);
            if (effect) this.volumes.effect = parseFloat(effect);
            if (voice) this.volumes.voice = parseFloat(voice);
            
            // Ensure all volumes are within valid range
            this.volumes.master = Math.max(0, Math.min(1, this.volumes.master));
            this.volumes.music = Math.max(0, Math.min(1, this.volumes.music));
            this.volumes.effect = Math.max(0, Math.min(1, this.volumes.effect));
            this.volumes.voice = Math.max(0, Math.min(1, this.volumes.voice));
        } catch (error) {
            console.warn('Error loading volumes from localStorage:', error);
        }
    }

    /**
     * Set up audio unlock listeners
     */
    private setupUnlockListeners(): void {
        if (typeof window === 'undefined') return;
        
        // Define unlock function
        const unlockAudio = () => {
            if (this.audioUnlocked) return;
            
            this.audioUnlocked = true;
            
            // Remove listeners once unlocked
            ['touchstart', 'touchend', 'mousedown', 'keydown'].forEach(event => {
                window.removeEventListener(event, unlockAudio);
            });
            
            console.log('Audio unlocked by user interaction');
        };
        
        // Add unlock listeners
        ['touchstart', 'touchend', 'mousedown', 'keydown'].forEach(event => {
            window.addEventListener(event, unlockAudio, false);
        });
    }
    
    /**
     * Clean up resources
     */
    public destroy(): void {
        // Stop all sounds
        this.sounds.forEach(sound => {
            if (sound.isPlaying) {
                sound.stop();
            }
        });
        
        // Clear collections
        this.sounds.clear();
        this.musicSounds.clear();
        this.effectSounds.clear();
        this.voiceSounds.clear();
        
        // Reset instance for garbage collection
        SoundManager.instance = null;
    }
}

// Add to window for global access if in browser environment
if (typeof window !== 'undefined') {
    (window as any).SoundManager = SoundManager;
}
