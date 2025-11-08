import Phaser from 'phaser'
import { Player } from '../../gameObjects/hakusen/Player'

export class HakusenScene extends Phaser.Scene {
  private player!: Player
  private obstacles!: Phaser.GameObjects.Group
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private score: number = 0
  private distance: number = 0
  private scoreText!: Phaser.GameObjects.Text
  private distanceText!: Phaser.GameObjects.Text
  private isGameOver: boolean = false
  private whiteLines: Phaser.GameObjects.Rectangle[] = []
  private backgroundElements: Phaser.GameObjects.GameObject[] = []

  private readonly ROAD_CENTER_Y: number = 540
  private readonly ROAD_HEIGHT: number = 400
  private readonly WHITE_LINE_WIDTH: number = 60
  private readonly LINE_SPACING: number = 80
  private readonly SCROLL_SPEED: number = 5
  private readonly SIDEWALK_WIDTH: number = 400
  private readonly CROSSWALK_START_X: number = 450

  constructor() {
    super({ key: 'HakusenScene' })
  }

  preload() {
    // キャラクタースプライトシートを読み込む
    // 画像サイズ: 1536x1024、3フレーム横並び → 各フレーム 512x1024
    this.load.spritesheet('player', 'assets/images/hakusen/player.png', {
      frameWidth: 512,
      frameHeight: 1024
    })
  }

  create() {
    const { width, height } = this.cameras.main

    // Reset state variables
    this.score = 0
    this.distance = 0
    this.isGameOver = false
    this.whiteLines = []
    this.backgroundElements = []

    this.createBackground(width, height)
    this.createCrosswalk(width, height)
    this.createUI(width, height)

    // 歩行アニメーションを作成
    if (!this.anims.exists('walk')) {
      this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 2 }),
        frameRate: 10,
        repeat: -1
      })
    }

    // プレイヤーを最初の白線の上に配置（i=2: 2*80-100=60）
    this.player = new Player(this, 60, this.ROAD_CENTER_Y)
    this.player.playWalkAnimation()

    this.obstacles = this.add.group()
    this.cursors = this.input.keyboard!.createCursorKeys()

    this.time.addEvent({
      delay: 2500,
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true
    })

    this.time.addEvent({
      delay: 100,
      callback: () => {
        if (!this.isGameOver) {
          this.distance += 1
          this.score = Math.floor(this.distance / 10)
          this.updateUI()
        }
      },
      callbackScope: this,
      loop: true
    })
  }

  update() {
    if (this.isGameOver) return

    this.scrollBackground()
    this.handlePlayerMovement()
    this.updateObstacles()
    this.checkCollisions()
    this.checkBoundary()
  }

  private createBackground(width: number, height: number): void {
    this.cameras.main.setBackgroundColor('#87ceeb')

    for (let i = 0; i < 8; i++) {
      const cloud = this.add.ellipse(
        Phaser.Math.Between(100, width + 500),
        Phaser.Math.Between(50, 250),
        Phaser.Math.Between(80, 120),
        40,
        0xffffff,
        0.7
      )
      this.backgroundElements.push(cloud)
    }

    // 上下の歩道
    const sidewalkTop = this.add.rectangle(
      width / 2,
      this.ROAD_CENTER_Y - this.ROAD_HEIGHT / 2 - 60,
      width,
      120,
      0xcccccc
    )
    sidewalkTop.setDepth(-1)

    const sidewalkBottom = this.add.rectangle(
      width / 2,
      this.ROAD_CENTER_Y + this.ROAD_HEIGHT / 2 + 60,
      width,
      120,
      0xcccccc
    )
    sidewalkBottom.setDepth(-1)

    for (let i = 0; i < 6; i++) {
      const tree = this.add.ellipse(
        Phaser.Math.Between(-100, width + 100),
        this.ROAD_CENTER_Y - this.ROAD_HEIGHT / 2 - 80,
        50,
        60,
        0x228b22
      )
      tree.setDepth(-1)
      this.backgroundElements.push(tree)
    }
  }

  private createCrosswalk(width: number, height: number): void {
    // 道路（画面全体）
    const road = this.add.rectangle(
      width / 2,
      this.ROAD_CENTER_Y,
      width,
      this.ROAD_HEIGHT,
      0x333333
    )
    road.setDepth(-1)

    // 横断歩道の白線（無限スクロール用に画面幅+余裕をカバー）
    const numLines = Math.floor((width + 200) / this.LINE_SPACING)

    for (let i = 0; i < numLines; i++) {
      const x = i * this.LINE_SPACING - 100

      const line = this.add.rectangle(
        x,
        this.ROAD_CENTER_Y,
        this.WHITE_LINE_WIDTH,
        this.ROAD_HEIGHT,
        0xffffff
      )
      line.setAlpha(0.9)
      this.whiteLines.push(line)
    }

    // 横断歩道の境界線（黄色）
    const yellowLineTop = this.add.rectangle(
      width / 2,
      this.ROAD_CENTER_Y - this.ROAD_HEIGHT / 2,
      width,
      4,
      0xffff00
    )
    yellowLineTop.setDepth(0)

    const yellowLineBottom = this.add.rectangle(
      width / 2,
      this.ROAD_CENTER_Y + this.ROAD_HEIGHT / 2,
      width,
      4,
      0xffff00
    )
    yellowLineBottom.setDepth(0)
  }

  private createUI(width: number, height: number): void {
    const uiBackground = this.add.rectangle(70, 50, 180, 100, 0x000000, 0.5)
    uiBackground.setDepth(100)
    uiBackground.setStrokeStyle(2, 0xffffff, 0.3)

    this.add.text(70, 30, '距離', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setDepth(101)

    this.distanceText = this.add.text(70, 55, '0m', {
      fontSize: '32px',
      color: '#ffd700',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(101)

    this.add.text(70, 75, 'スコア', {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setDepth(101)

    this.scoreText = this.add.text(70, 90, '0', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setDepth(101)

    const backButton = this.add.text(width - 80, 40, '✕', {
      fontSize: '36px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    })
      .setOrigin(0.5)
      .setDepth(100)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        backButton.setColor('#ff0000')
        backButton.setScale(1.2)
      })
      .on('pointerout', () => {
        backButton.setColor('#ffffff')
        backButton.setScale(1)
      })
      .on('pointerdown', () => this.goBack())

    const controlHint = this.add.text(width / 2, height - 40, '↑ ↓ キーで白線の上を移動 | 白線から外れるとゲームオーバー', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(100).setAlpha(0.7)

    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: controlHint,
        alpha: 0,
        duration: 1000,
        onComplete: () => controlHint.destroy()
      })
    })
  }

  private scrollBackground(): void {
    // 白線を左にスクロール（無限ループ）
    this.whiteLines.forEach(line => {
      line.x -= this.SCROLL_SPEED

      // 画面左端を超えたら右端に再配置
      if (line.x < -this.WHITE_LINE_WIDTH) {
        line.x = this.cameras.main.width + this.WHITE_LINE_WIDTH
      }
    })

    // 背景要素もスクロール
    this.backgroundElements.forEach((element: any) => {
      if (element.y < this.cameras.main.height / 2) {
        element.x -= 0.5
        if (element.x < -100) {
          element.x = this.cameras.main.width + 100
        }
      } else {
        element.x -= 1
        if (element.x < -100) {
          element.x = this.cameras.main.width + 100
        }
      }
    })
  }

  private handlePlayerMovement(): void {
    if (this.player.getIsJumping()) return

    const topBoundary = this.ROAD_CENTER_Y - this.ROAD_HEIGHT / 2 + 30
    const bottomBoundary = this.ROAD_CENTER_Y + this.ROAD_HEIGHT / 2 - 30
    const jumpDistance = 80

    // 上下移動のみ（スムーズな移動）
    const moveSpeed = 6
    if (this.cursors.up.isDown) {
      this.player.y -= moveSpeed
      if (this.player.y < topBoundary) {
        this.player.y = topBoundary
      }
    } else if (this.cursors.down.isDown) {
      this.player.y += moveSpeed
      if (this.player.y > bottomBoundary) {
        this.player.y = bottomBoundary
      }
    }
  }

  private spawnObstacle(): void {
    if (this.isGameOver) return

    const minY = this.ROAD_CENTER_Y - this.ROAD_HEIGHT / 2 + 50
    const maxY = this.ROAD_CENTER_Y + this.ROAD_HEIGHT / 2 - 50
    const y = Phaser.Math.Between(minY, maxY)

    const obstacleTypes = [
      { color: 0x8b4513, size: 25, shape: 'circle', name: '石' },
      { color: 0xc0c0c0, size: 20, shape: 'rect', name: '缶' },
      { color: 0x7cb342, size: 30, shape: 'ellipse', name: '葉' }
    ]

    const type = Phaser.Math.RND.pick(obstacleTypes)
    let obstacle: any

    if (type.shape === 'circle') {
      obstacle = this.add.circle(this.cameras.main.width + 30, y, type.size / 2, type.color)
    } else if (type.shape === 'rect') {
      obstacle = this.add.rectangle(this.cameras.main.width + 30, y, type.size, type.size, type.color)
    } else {
      obstacle = this.add.ellipse(this.cameras.main.width + 30, y, type.size, type.size / 2, type.color)
    }

    this.physics.add.existing(obstacle)
    const body = obstacle.body as Phaser.Physics.Arcade.Body
    body.setVelocityX(-200)

    this.obstacles.add(obstacle)
  }

  private updateObstacles(): void {
    this.obstacles.children.entries.forEach((obs) => {
      const obstacle = obs as any

      if (obstacle.x < -50) {
        obstacle.destroy()
      }
    })
  }

  private checkCollisions(): void {
    this.obstacles.children.entries.forEach((obs) => {
      const obstacle = obs as any

      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        obstacle.x,
        obstacle.y
      )

      if (distance < 28) {
        this.gameOver()
      }
    })
  }

  private checkBoundary(): void {
    // 常に白線の上にいるかチェック
    const playerOnWhiteLine = this.isPlayerOnWhiteLine()

    if (!playerOnWhiteLine) {
      this.gameOver()
    }
  }

  private isPlayerOnWhiteLine(): boolean {
    const tolerance = 5
    let onLine = false

    this.whiteLines.forEach(line => {
      const leftEdge = line.x - this.WHITE_LINE_WIDTH / 2
      const rightEdge = line.x + this.WHITE_LINE_WIDTH / 2

      if (this.player.x >= leftEdge - tolerance && this.player.x <= rightEdge + tolerance) {
        onLine = true
      }
    })

    return onLine
  }

  private updateUI(): void {
    this.distanceText.setText(`${this.distance}m`)
    this.scoreText.setText(`${this.score}`)
  }

  private gameOver(): void {
    if (this.isGameOver) return

    this.isGameOver = true
    const { width, height } = this.cameras.main

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
    overlay.setDepth(200)

    const resultBox = this.add.rectangle(width / 2, height / 2, 600, 400, 0x1a1a1a)
    resultBox.setDepth(201)
    resultBox.setStrokeStyle(4, 0x5b9dd9)

    this.add.text(width / 2, height / 2 - 130, 'ゲーム終了', {
      fontSize: '56px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(202)

    this.add.text(width / 2, height / 2 - 50, '歩いた距離', {
      fontSize: '24px',
      color: '#aaaaaa',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setDepth(202)

    this.add.text(width / 2, height / 2, `${this.distance}m`, {
      fontSize: '64px',
      color: '#ffd700',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(202)

    this.add.text(width / 2, height / 2 + 60, `スコア: ${this.score}`, {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5).setDepth(202)

    const retryButton = this.add.text(width / 2 - 120, height / 2 + 130, 'もう一度', {
      fontSize: '28px',
      color: '#ffffff',
      backgroundColor: '#5b9dd9',
      padding: { x: 30, y: 15 },
      fontFamily: 'Arial, sans-serif'
    })
      .setOrigin(0.5)
      .setDepth(202)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        retryButton.setScale(1.1)
        retryButton.setBackgroundColor('#7cb9e8')
      })
      .on('pointerout', () => {
        retryButton.setScale(1)
        retryButton.setBackgroundColor('#5b9dd9')
      })
      .on('pointerdown', () => this.scene.restart())

    const menuButton = this.add.text(width / 2 + 120, height / 2 + 130, 'メニュー', {
      fontSize: '28px',
      color: '#ffffff',
      backgroundColor: '#666666',
      padding: { x: 30, y: 15 },
      fontFamily: 'Arial, sans-serif'
    })
      .setOrigin(0.5)
      .setDepth(202)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        menuButton.setScale(1.1)
        menuButton.setBackgroundColor('#888888')
      })
      .on('pointerout', () => {
        menuButton.setScale(1)
        menuButton.setBackgroundColor('#666666')
      })
      .on('pointerdown', () => this.goBack())
  }

  private goBack(): void {
    this.scene.start('MenuScene')
  }
}
