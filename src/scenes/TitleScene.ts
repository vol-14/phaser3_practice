import Phaser from 'phaser'
import { Button } from '../gameObjects/common/Button'

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' })
  }

  create() {
    const { width, height } = this.cameras.main

    // 背景色
    this.cameras.main.setBackgroundColor('#f5f5f0')

    // タイトル「追憶」
    this.add.text(width / 2, height / 2 - 220, '追憶', {
      fontSize: '120px',
      color: '#000000',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // 青いアンダーライン
    this.add.rectangle(
      width / 2,
      height / 2 - 150,
      200,
      6,
      0x5b9dd9
    )

    // サブタイトル「Nostalgia Game」
    this.add.text(width / 2, height / 2 - 80, 'Nostalgia Game', {
      fontSize: '36px',
      color: '#7cb342',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5)

    // Stageボタン（青）
    new Button(this, {
      x: width / 2,
      y: height / 2 + 70,
      width: 800,
      height: 120,
      text: 'Stage',
      backgroundColor: 0x5b9dd9,
      textColor: '#ffffff',
      fontSize: '48px',
      onClick: () => this.goToMenu()
    })

    // 下部の説明文
    this.add.text(width / 2, height / 2 + 380, 'スペースキー or CLICK で開始', {
      fontSize: '28px',
      color: '#999999',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5)

    // スペースキーでも開始可能
    this.input.keyboard?.once('keydown-SPACE', () => {
      this.goToMenu()
    })
  }

  private goToMenu(): void {
    this.scene.start('MenuScene')
  }
}
