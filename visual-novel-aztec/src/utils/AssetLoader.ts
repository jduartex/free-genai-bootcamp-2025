import Phaser from 'phaser';

export function preloadAssets(scene: Phaser.Scene): void {
  // Background images
  scene.load.image('prison-cell', 'assets/scenes/prison_cell.jpg');
  scene.load.image('aztec-village', 'assets/scenes/aztec_village.jpg');
  scene.load.image('spanish-invasion', 'assets/scenes/spanish_invasion.jpg');
  scene.load.image('hidden-tunnel', 'assets/scenes/hidden_tunnel.jpg');
  
  // Character images
  scene.load.image('tlaloc', 'assets/characters/tlaloc.png');
  scene.load.image('citlali', 'assets/characters/citlali.png');
  scene.load.image('diego', 'assets/characters/diego.png');
  
  // UI elements
  scene.load.image('dialog-box', 'assets/ui/dialog_box.png');
  scene.load.image('timer', 'assets/ui/timer.png');
  scene.load.image('button', 'assets/ui/button.png');
  scene.load.image('button-hover', 'assets/ui/button_hover.png');
  scene.load.image('inventory-icon', 'assets/ui/inventory_icon.png');
  scene.load.image('help-icon', 'assets/ui/help_icon.png');
  
  // Interactive objects
  scene.load.image('window', 'assets/objects/window.png');
  scene.load.image('floor-pattern', 'assets/objects/floor_pattern.png');
  scene.load.image('bed', 'assets/objects/bed.png');
  scene.load.image('door', 'assets/objects/door.png');
  scene.load.image('temple', 'assets/objects/temple.png');
  scene.load.image('return-arrow', 'assets/ui/return_arrow.png');
  scene.load.image('exit', 'assets/objects/exit.png');
  
  // Audio
  scene.load.audio('theme', 'assets/audio/theme.mp3');
  scene.load.audio('click', 'assets/audio/click.mp3');
  scene.load.audio('hover', 'assets/audio/hover.mp3');
  scene.load.audio('success', 'assets/audio/success.mp3');
  scene.load.audio('fail', 'assets/audio/fail.mp3');
  scene.load.audio('warning', 'assets/audio/warning.mp3');
  scene.load.audio('pickup', 'assets/audio/pickup.mp3');
  scene.load.audio('prison-ambience', 'assets/audio/prison_ambience.mp3');
  scene.load.audio('village-ambience', 'assets/audio/village_ambience.mp3');
  scene.load.audio('battle-ambience', 'assets/audio/battle_ambience.mp3');
  scene.load.audio('tunnel-ambience', 'assets/audio/tunnel_ambience.mp3');
}
