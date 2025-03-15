import Phaser from 'phaser';

export interface ItemData {
  id: string;
  name: string;
  nameJapanese: string;
  description: string;
  descriptionJapanese: string;
  usableWith?: string[];
  effect?: string;
}

export class InventoryItem {
  private id: string;
  private data: ItemData;
  private sprite: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, data: ItemData, x: number, y: number) {
    this.id = data.id;
    this.data = data;
    
    // Create sprite
    this.sprite = scene.add.sprite(x, y, data.id)
      .setInteractive({ useHandCursor: true });
      
    if (!scene.textures.exists(data.id)) {
      // Create placeholder if texture doesn't exist
      const graphics = scene.add.graphics();
      graphics.fillStyle(0xffcc00, 1);
      graphics.fillRect(0, 0, 64, 64);
      graphics.lineStyle(2, 0x000000);
      graphics.strokeRect(0, 0, 64, 64);
      graphics.generateTexture(data.id, 64, 64);
      graphics.destroy();
      
      this.sprite.setTexture(data.id);
    }
  }
  
  public getId(): string {
    return this.id;
  }
  
  public getData(): ItemData {
    return this.data;
  }
  
  public getSprite(): Phaser.GameObjects.Sprite {
    return this.sprite;
  }
  
  public canUseWith(objectId: string): boolean {
    return this.data.usableWith ? this.data.usableWith.includes(objectId) : false;
  }
}
