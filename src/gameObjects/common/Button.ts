import Phaser from 'phaser'

export interface ButtonConfig {
  x: number
  y: number
  width: number
  height: number
  text: string
  backgroundColor: number
  textColor: string
  fontSize: string
  onClick: () => void
}

export class Button extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics
  private label: Phaser.GameObjects.Text
  private config: ButtonConfig

  constructor(scene: Phaser.Scene, config: ButtonConfig) {
    super(scene, config.x, config.y)
    this.config = config

    // 背景の角丸矩形
    this.background = scene.add.graphics()
    this.drawBackground(1)

    // インタラクティブエリアを設定
    this.background.setInteractive(
      new Phaser.Geom.Rectangle(-config.width / 2, -config.height / 2, config.width, config.height),
      Phaser.Geom.Rectangle.Contains
    )
    this.background.input!.cursor = 'pointer'

    // テキストラベル
    this.label = scene.add.text(0, 0, config.text, {
      fontSize: config.fontSize,
      color: config.textColor,
      fontFamily: 'Arial, sans-serif'
    })
    this.label.setOrigin(0.5)

    // コンテナに追加
    this.add(this.background)
    this.add(this.label)

    // インタラクション
    this.background.on('pointerover', () => this.onHover())
    this.background.on('pointerout', () => this.onOut())
    this.background.on('pointerdown', () => this.onDown())
    this.background.on('pointerup', () => {
      this.onUp()
      config.onClick()
    })

    scene.add.existing(this)
  }

  private drawBackground(alpha: number): void {
    this.background.clear()
    this.background.fillStyle(this.config.backgroundColor, alpha)
    this.background.fillRoundedRect(
      -this.config.width / 2,
      -this.config.height / 2,
      this.config.width,
      this.config.height,
      16 // 角丸の半径
    )
  }

  private onHover(): void {
    this.drawBackground(0.9)
  }

  private onOut(): void {
    this.drawBackground(1)
  }

  private onDown(): void {
    this.setScale(0.95)
  }

  private onUp(): void {
    this.setScale(1)
  }
}
