import Phaser from 'phaser'
import { TitleScene } from './scenes/TitleScene'
import { MenuScene } from './scenes/MenuScene'
import { HakusenScene } from './scenes/games/HakusenScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1920,
    height: 1080
  },
  backgroundColor: '#f5f5f0',
  parent: 'game-container',
  scene: [TitleScene, MenuScene, HakusenScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false
  }
}

new Phaser.Game(config)
