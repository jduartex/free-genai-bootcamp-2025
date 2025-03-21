import Phaser from 'phaser';

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CreditsScene' });
  }

  create(): void {
    // Create background
    this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000
    );

    // Add title
    this.add.text(
      this.cameras.main.width / 2,
      100,
      'Aztec Escape',
      {
        fontFamily: 'Crimson Text',
        fontSize: '64px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);

    // Add credits text
    this.add.text(
      this.cameras.main.width / 2,
      220,
      'Thank you for playing!',
      {
        fontFamily: 'Noto Sans JP',
        fontSize: '32px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);

    // Credits content
    const creditsContent = [
      'Developer: Your Name',
      '',
      'Artwork: Placeholder Graphics',
      '',
      'Japanese Language Content:',
      'Basic JLPT N5 Vocabulary',
      '',
      'Special Thanks:',
      'Japanese Language Learners Community'
    ].join('\n');

    this.add.text(
      this.cameras.main.width / 2,
      300,
      creditsContent,
      {
        fontFamily: 'Crimson Text',
        fontSize: '24px',
        color: '#ffffff',
        align: 'center'
      }
    ).setOrigin(0.5, 0);

    // Add return to menu button
    const returnButton = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height - 100,
      300,
      60,
      0x333333
    ).setStrokeStyle(2, 0xffffff)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      returnButton.fillColor = 0x555555;
    })
    .on('pointerout', () => {
      returnButton.fillColor = 0x333333;
    })
    .on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height - 100,
      'Return to Menu',
      {
        fontFamily: 'Crimson Text',
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
  }
}
