import Phaser from 'phaser'

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {
    // 画像やアセットの読み込みが必要な場合はここに記述
  }

  create() {
    // タイトル画面へ遷移
    this.scene.start('TitleScene')
  }
}
