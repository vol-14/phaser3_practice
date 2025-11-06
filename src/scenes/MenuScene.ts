import Phaser from 'phaser'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
  }

  create() {
    const { width, height } = this.cameras.main

    // 背景色
    this.cameras.main.setBackgroundColor('#f5f5f0')

    // タイトル「ステージ選択」
    const titleBg = this.add.graphics()
    titleBg.fillStyle(0xcccccc, 1)
    titleBg.fillRoundedRect(width / 2 - 200, 50, 400, 100, 8)

    this.add.text(width / 2, 100, 'ステージ選択', {
      fontSize: '48px',
      color: '#000000',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // 4つのステージボタン（楕円形）
    const stages = [
      { name: 'ステージ1\nねり消し作り', x: width / 2 - 300, y: 350, scene: 'NeriKeshiScene' },
      { name: 'ステージ2\n消しピン', x: width / 2 + 300, y: 350, scene: 'KeshiPinScene' },
      { name: 'ステージ3\n白線歩き', x: width / 2 - 300, y: 650, scene: 'HakusenScene' },
      { name: 'ステージ4\n油つなげ', x: width / 2 + 300, y: 650, scene: 'OilConnectScene' }
    ]

    stages.forEach(stage => {
      this.createStageButton(stage.x, stage.y, stage.name, stage.scene)
    })

    // 戻るボタン
    const backButton = this.add.text(100, height - 100, '← 戻る', {
      fontSize: '32px',
      color: '#666666',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0, 0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => backButton.setColor('#000000'))
    .on('pointerout', () => backButton.setColor('#666666'))
    .on('pointerdown', () => this.goBack())
  }

  private createStageButton(x: number, y: number, text: string, sceneKey: string): void {
    // 楕円形の背景
    const ellipse = this.add.graphics()
    ellipse.fillStyle(0xdddddd, 1)
    ellipse.fillEllipse(x, y, 400, 240)

    // インタラクティブ領域を設定
    const hitArea = new Phaser.Geom.Ellipse(0, 0, 400, 240)
    ellipse.setInteractive(hitArea, Phaser.Geom.Ellipse.Contains)
    ellipse.input!.cursor = 'pointer'

    // テキスト
    const label = this.add.text(x, y, text, {
      fontSize: '42px',
      color: '#000000',
      fontFamily: 'Arial, sans-serif',
      align: 'center'
    }).setOrigin(0.5)

    // ホバーエフェクト
    ellipse.on('pointerover', () => {
      ellipse.clear()
      ellipse.fillStyle(0xcccccc, 1)
      ellipse.fillEllipse(x, y, 400, 240)
    })

    ellipse.on('pointerout', () => {
      ellipse.clear()
      ellipse.fillStyle(0xdddddd, 1)
      ellipse.fillEllipse(x, y, 400, 240)
    })

    ellipse.on('pointerdown', () => {
      this.startGame(sceneKey)
    })
  }

  private startGame(sceneKey: string): void {
    this.scene.start(sceneKey)
  }

  private goBack(): void {
    this.scene.start('TitleScene')
  }
}
