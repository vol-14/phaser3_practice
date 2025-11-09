import Phaser from 'phaser'

export class LoadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics
  private progressBox!: Phaser.GameObjects.Graphics
  private percentText!: Phaser.GameObjects.Text
  private loadingText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'LoadScene' })
  }

  preload() {
    const { width, height } = this.cameras.main

    // 背景色
    this.cameras.main.setBackgroundColor('#f5f5f0')

    // ローディングテキスト
    this.loadingText = this.add.text(width / 2, height / 2 - 100, 'Loading...', {
      fontSize: '48px',
      color: '#000000',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // プログレスバーの背景（グレーの枠）
    this.progressBox = this.add.graphics()
    this.progressBox.fillStyle(0xcccccc, 0.8)
    this.progressBox.fillRect(width / 2 - 320, height / 2 - 30, 640, 60)

    // プログレスバー本体（青色）
    this.progressBar = this.add.graphics()

    // パーセント表示
    this.percentText = this.add.text(width / 2, height / 2, '0%', {
      fontSize: '32px',
      color: '#000000',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5)

    // ローディングイベント設定
    this.load.on('progress', (value: number) => {
      this.updateProgressBar(value)
    })

    this.load.on('complete', () => {
      this.progressBar.destroy()
      this.progressBox.destroy()
      this.percentText.destroy()
      this.loadingText.destroy()
    })

    // 全ゲームのアセットをここで読み込む
    this.loadAssets()
  }

  private updateProgressBar(value: number) {
    const { width, height } = this.cameras.main

    // プログレスバーを更新
    this.progressBar.clear()
    this.progressBar.fillStyle(0x5b9dd9, 1)
    this.progressBar.fillRect(width / 2 - 310, height / 2 - 20, 620 * value, 40)

    // パーセント表示を更新
    this.percentText.setText(`${Math.floor(value * 100)}%`)
  }

  private loadAssets() {
    // 白線渡りゲームのアセット
    this.load.spritesheet('player', 'assets/images/hakusen/player.png', {
      frameWidth: 512,
      frameHeight: 1024
    })
    this.load.image('cloud', 'assets/images/hakusen/cloud.png')
    this.load.image('tree', 'assets/images/hakusen/tree.png')

    // 他のゲームのアセットもここに追加
    // 例: this.load.image('背景', 'assets/images/background.png')
  }

  create() {
    // ローディング完了後、少し待ってからタイトル画面へ
    this.time.delayedCall(500, () => {
      this.scene.start('TitleScene')
    })
  }
}
