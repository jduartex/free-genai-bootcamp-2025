import Phaser from 'phaser';

export class InteractiveObject {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Sprite;
  private label: Phaser.GameObjects.Text;
  private labelBg: Phaser.GameObjects.Rectangle;
  private interactionCallback: () => void;
  private hoverTween: Phaser.Tweens.Tween | null = null;
  private isHovering: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    labelText: string,
    onInteract: () => void,
    width: number = 64,
    height: number = 64
  ) {
    this.scene = scene;
    this.interactionCallback = onInteract;

    // Create interactive sprite
    this.sprite = scene.add.sprite(x, y, textureKey)
      .setDisplaySize(width, height)
      .setInteractive({ useHandCursor: true });

    // If texture doesn't exist yet, use a placeholder
    if (!scene.textures.exists(textureKey)) {
      // Create a circle as placeholder
      const graphics = scene.add.graphics();
      graphics.fillStyle(0xffff00, 0.8);
      graphics.fillCircle(0, 0, width / 2);
      graphics.lineStyle(2, 0x000000, 1);
      graphics.strokeCircle(0, 0, width / 2);
      
      // Generate texture from graphics
      graphics.generateTexture(textureKey, width, height);
      graphics.destroy();
      
      // Update the sprite with the new texture
      this.sprite.setTexture(textureKey);
    }

    // Create label background
    this.labelBg = scene.add.rectangle(
      x,
      y - height/2 - 20,
      200,
      30,
      0x000000,
      0.7
    ).setOrigin(0.5, 0.5)
    .setVisible(false);

    // Create text label
    this.label = scene.add.text(
      x,
      y - height/2 - 20,
      labelText,
      {
        fontSize: '18px',
        fontFamily: 'Noto Sans JP',
        color: '#ffffff',
        align: 'center'
      }
    ).setOrigin(0.5, 0.5)
    .setVisible(false);

    // Add hover effect
    this.sprite.on('pointerover', this.onPointerOver, this);
    this.sprite.on('pointerout', this.onPointerOut, this);
    this.sprite.on('pointerdown', this.onPointerDown, this);

    // Add slight pulse animation to indicate interactivity
    scene.tweens.add({
      targets: this.sprite,
      scale: { from: 1, to: 1.05 },
      alpha: { from: 0.95, to: 1 },
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    // Adjust label width based on text
    const padding = 20;
    const bounds = this.label.getBounds();
    this.labelBg.width = bounds.width + padding;
  }

  onPointerOver(): void {
    this.isHovering = true;
    
    // Show the label
    this.label.setVisible(true);
    this.labelBg.setVisible(true);
    
    // Play hover sound safely
    this.playSoundSafe('hover', 0.3);
    
    // Add hover effect
    this.hoverTween = this.scene.tweens.add({
      targets: this.sprite,
      scale: 1.2,
      duration: 200,
      ease: 'Sine.easeOut'
    });
  }

  onPointerOut(): void {
    this.isHovering = false;
    
    // Hide the label
    this.label.setVisible(false);
    this.labelBg.setVisible(false);
    
    // Remove hover effect
    if (this.hoverTween) {
      this.hoverTween.stop();
    }
    
    this.scene.tweens.add({
      targets: this.sprite,
      scale: 1.0,
      duration: 200,
      ease: 'Sine.easeOut'
    });
  }

  onPointerDown(): void {
    // Play click sound safely
    this.playSoundSafe('click', 0.5);
    
    // Execute the interaction callback
    this.interactionCallback();
    
    // Add click effect
    this.scene.tweens.add({
      targets: this.sprite,
      scale: { from: 1.2, to: 1.0 },
      duration: 100,
      ease: 'Sine.easeOut'
    });
  }

  // Add a helper method to safely play sounds
  private playSoundSafe(key: string, volume: number = 0.5): void {
    try {
      if (this.scene.cache.audio.exists(key)) {
        this.scene.sound.play(key, { volume });
      } else {
        // Sound doesn't exist, just skip playing it
        console.warn(`Sound "${key}" not available for interactive object`);
      }
    } catch (e) {
      console.warn(`Error playing sound "${key}":`, e);
    }
  }

  update(time: number, delta: number): void {
    // Any per-frame updates can go here
    
    // Ensure label follows object if moving
    if (this.isHovering) {
      this.label.setPosition(this.sprite.x, this.sprite.y - this.sprite.displayHeight/2 - 20);
      this.labelBg.setPosition(this.sprite.x, this.sprite.y - this.sprite.displayHeight/2 - 20);
    }
  }

  destroy(): void {
    // Clean up all created objects
    this.sprite.destroy();
    this.label.destroy();
    this.labelBg.destroy();
    
    if (this.hoverTween) {
      this.hoverTween.stop();
      this.hoverTween = null;
    }
  }

  setPosition(x: number, y: number): void {
    this.sprite.setPosition(x, y);
  }

  setVisible(visible: boolean): void {
    this.sprite.setVisible(visible);
  }
}
