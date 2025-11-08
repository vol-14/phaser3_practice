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
  private gameStarted: boolean = false
  private inCrosswalk: boolean = false

  private readonly GROUND_Y: number = 880  // 地面の高さ（画面下部）
  private readonly BLOCK_WIDTH: number = 120  // 白ブロックの幅
  private readonly BLOCK_HEIGHT: number = 50  // 白ブロックの高さ
  private readonly BLOCK_GAP: number = 120  // ブロック間のギャップ
  private readonly SCROLL_SPEED: number = 3  // スクロール速度
  private readonly SIDEWALK_WIDTH: number = 300  // 歩道エリアの幅
  private currentBlockIndex: number = 0  // プレイヤーが乗っているブロックのインデックス
  private keyPressStartTime: number = 0  // キー押下開始時刻
  private keyPressDirection: string = ''  // 押されているキーの方向
  private jumpGaugeBackground!: Phaser.GameObjects.Rectangle  // ジャンプゲージの背景
  private jumpGaugeFill!: Phaser.GameObjects.Rectangle  // ジャンプゲージの塗りつぶし部分
  private jumpGaugeText!: Phaser.GameObjects.Text  // ジャンプゲージのテキスト
  private sidewalk!: Phaser.GameObjects.Rectangle  // 歩道エリア
  private curbEdge!: Phaser.GameObjects.Rectangle  // 縁石
  private tutorialShown: boolean = false  // チュートリアル表示済みフラグ
  private lastPlayerX: number = 0  // 前回のプレイヤーのX座標
  private accumulatedDistance: number = 0  // 累積距離（ピクセル単位での端数を保持）

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

    // 背景画像を読み込む
    this.load.image('cloud', 'assets/images/hakusen/cloud.png')
    this.load.image('tree', 'assets/images/hakusen/tree.png')
  }

  create() {
    const { width, height } = this.cameras.main

    // Reset state variables
    this.score = 0
    this.distance = 0
    this.isGameOver = false
    this.gameStarted = false
    this.inCrosswalk = false
    this.whiteLines = []
    this.backgroundElements = []
    this.currentBlockIndex = 0
    this.keyPressStartTime = 0
    this.keyPressDirection = ''
    this.lastPlayerX = 0
    this.accumulatedDistance = 0

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

    // プレイヤーを歩道エリアに配置
    this.player = new Player(this, 150, this.GROUND_Y - this.BLOCK_HEIGHT / 2 - 40)
    this.player.playWalkAnimation()

    // 歩道エリアからスタート
    this.inCrosswalk = false

    this.obstacles = this.add.group()
    this.cursors = this.input.keyboard!.createCursorKeys()

    // チュートリアルモーダルを表示
    this.showTutorialModal(width, height)
  }

  private showTutorialModal(width: number, height: number): void {
    // モーダルの背景（暗いオーバーレイ）
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
    overlay.setDepth(300)

    // モーダルボックス
    const modalBox = this.add.rectangle(width / 2, height / 2, 700, 500, 0x1a1a1a)
    modalBox.setDepth(301)
    modalBox.setStrokeStyle(4, 0x5b9dd9)

    // タイトル
    const title = this.add.text(width / 2, height / 2 - 220, '白線渡りゲーム', {
      fontSize: '42px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)
    title.setDepth(302)

    // 説明文
    const instructions = [
      '← → キーを長押ししてジャンプ！',
      '押す時間でジャンプの距離が変わります',
      '',
      '白いブロックの上だけを移動してください',
      '黒い部分に落ちるとゲームオーバーです',
      '',
      'できるだけ遠くまで進みましょう！'
    ]

    const instructionText = this.add.text(width / 2, height / 2 - 60, instructions.join('\n'), {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      align: 'center',
      lineSpacing: 12
    })
    instructionText.setOrigin(0.5)
    instructionText.setDepth(302)

    // スタートボタン
    const startButton = this.add.text(width / 2, height / 2 + 180, 'ゲームスタート', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#5b9dd9',
      padding: { x: 40, y: 20 },
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    })
    startButton.setOrigin(0.5)
    startButton.setDepth(302)
    startButton.setInteractive({ useHandCursor: true })
    startButton.on('pointerover', () => {
      startButton.setScale(1.1)
      startButton.setBackgroundColor('#7cb9e8')
    })
    startButton.on('pointerout', () => {
      startButton.setScale(1)
      startButton.setBackgroundColor('#5b9dd9')
    })
    startButton.on('pointerdown', () => {
      // モーダルを削除
      overlay.destroy()
      modalBox.destroy()
      title.destroy()
      instructionText.destroy()
      startButton.destroy()

      // チュートリアル表示済みフラグを立てる
      this.tutorialShown = true

      // カウントダウンを開始
      this.startCountdown(width, height)
    })
  }

  private startCountdown(width: number, height: number): void {
    // カウントダウン表示
    const countdownText = this.add.text(width / 2, height / 2, '準備...', {
      fontSize: '72px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(300)

    let countdown = 3
    const countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (countdown > 0) {
          countdownText.setText(countdown.toString())
          countdown--
        } else {
          countdownText.setText('スタート!')
          this.time.delayedCall(500, () => {
            countdownText.destroy()
            this.gameStarted = true
            // プレイヤーの初期位置を記録
            if (this.player) {
              this.lastPlayerX = this.player.x
            }
            // タイマーを開始
            this.setupTimers()
          })
          countdownTimer.destroy()
        }
      },
      callbackScope: this,
      loop: true
    })
  }

  private setupTimers(): void {
    this.time.addEvent({
      delay: 2500,
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true
    })

  }

  update() {
    if (this.isGameOver) return

    // 歩道エリアを常に画面左端に固定
    // プレイヤーが歩道エリアを出たら、歩道を非表示にする
    if (this.player && this.player.x > this.SIDEWALK_WIDTH) {
      this.sidewalk.setVisible(false)
      this.curbEdge.setVisible(false)
    } else {
      this.sidewalk.setVisible(true)
      this.curbEdge.setVisible(true)
      this.sidewalk.setPosition(this.SIDEWALK_WIDTH / 2, this.GROUND_Y)
      this.curbEdge.setPosition(this.SIDEWALK_WIDTH, this.GROUND_Y)
    }

    // ゲーム開始前は何もしない
    if (!this.gameStarted) {
      return
    }

    // プレイヤーの実際の移動距離を計算（ピクセルをメートルに変換）
    if (this.player && this.lastPlayerX > 0) {
      const movedPixels = this.player.x - this.lastPlayerX
      if (movedPixels > 0) {
        // ピクセル単位で累積
        this.accumulatedDistance += movedPixels
        // 50ピクセル = 1メートルとして変換
        const newDistance = Math.floor(this.accumulatedDistance / 50)
        if (newDistance > this.distance) {
          this.distance = newDistance
          this.score = Math.floor(this.distance / 10)
          this.updateUI()
        }
      }
    }
    if (this.player) {
      this.lastPlayerX = this.player.x
    }

    // ブロックをスクロール（左に移動）
    this.scrollBlocks()

    this.handlePlayerMovement()
    this.updateJumpGauge()
    this.updateObstacles()
    this.checkCollisions()
    this.checkIfPlayerFell()
  }

  private createBackground(width: number, height: number): void {
    // 空の背景（明るい青空）
    this.cameras.main.setBackgroundColor('#87CEEB')

    // 遠くの山々（シルエット）
    const mountainBack = this.add.graphics()
    mountainBack.fillStyle(0x9db4c0, 0.3)
    mountainBack.fillTriangle(
      -100, this.GROUND_Y - 150,
      300, this.GROUND_Y - 400,
      700, this.GROUND_Y - 150
    )
    mountainBack.fillTriangle(
      400, this.GROUND_Y - 150,
      800, this.GROUND_Y - 350,
      1200, this.GROUND_Y - 150
    )
    mountainBack.setDepth(-5)

    // 草原（地面との境界）
    const grass = this.add.rectangle(
      width / 2,
      this.GROUND_Y - 25,
      width * 2,
      100,
      0x90c090,
      1
    )
    grass.setDepth(-3)

    // 雲（画像を使用）- 数を増やして明るく
    for (let i = 0; i < 6; i++) {
      const cloud = this.add.image(
        Phaser.Math.Between(100, width + 800),
        Phaser.Math.Between(80, 200),
        'cloud'
      )
      cloud.setScale(Phaser.Math.FloatBetween(0.12, 0.2))
      cloud.setAlpha(0.8)
      cloud.setDepth(-2)
      this.backgroundElements.push(cloud)
    }

    // 木（遠景）- より自然な配置
    for (let i = 0; i < 5; i++) {
      const tree = this.add.image(
        Phaser.Math.Between(200, width + 600),
        this.GROUND_Y - 35,
        'tree'
      )
      tree.setScale(Phaser.Math.FloatBetween(0.12, 0.2))
      tree.setDepth(-1)
      tree.setAlpha(0.6)
      tree.setOrigin(0.5, 0.85)
      this.backgroundElements.push(tree)
    }

    // 地面（黒い部分 - ブロックの下）
    const ground = this.add.rectangle(
      width / 2,
      this.GROUND_Y + 100,
      width,
      300,
      0x000000
    )
    ground.setDepth(-1)

    // 左側の歩道エリア（安全地帯）- 白色に変更
    this.sidewalk = this.add.rectangle(
      this.SIDEWALK_WIDTH / 2,
      this.GROUND_Y,
      this.SIDEWALK_WIDTH,
      this.BLOCK_HEIGHT,
      0xffffff  // 白色
    )
    this.sidewalk.setDepth(10)  // 白ブロックと同じ高さ

    // 歩道の右端（縁石を白にして見えなくする）
    this.curbEdge = this.add.rectangle(
      this.SIDEWALK_WIDTH,
      this.GROUND_Y,
      8,
      this.BLOCK_HEIGHT,
      0xffffff  // 白色に変更
    )
    this.curbEdge.setDepth(11)  // 歩道より上
  }

  private createCrosswalk(width: number, height: number): void {
    // 横方向に並んだ白いブロックを作成（歩道の右端から連続的に配置）
    const numBlocks = Math.floor((width - this.SIDEWALK_WIDTH) / (this.BLOCK_WIDTH + this.BLOCK_GAP)) + 3

    for (let i = 0; i < numBlocks; i++) {
      // 歩道の右端（300px）から白ブロックを配置
      // 最初のブロックは歩道の右端から開始
      const x = this.SIDEWALK_WIDTH + this.BLOCK_WIDTH / 2 + (i * (this.BLOCK_WIDTH + this.BLOCK_GAP))

      const block = this.add.rectangle(
        x,
        this.GROUND_Y,
        this.BLOCK_WIDTH,
        this.BLOCK_HEIGHT,
        0xffffff
      )
      block.setDepth(10)
      this.whiteLines.push(block)
    }
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

    // ジャンプゲージUI作成（プレイヤーの上に表示）
    const gaugeWidth = 150
    const gaugeHeight = 20

    this.jumpGaugeBackground = this.add.rectangle(
      width / 2,
      height / 2 - 100,
      gaugeWidth,
      gaugeHeight,
      0x000000,
      0.7
    )
    this.jumpGaugeBackground.setDepth(200)
    this.jumpGaugeBackground.setVisible(false)
    this.jumpGaugeBackground.setStrokeStyle(2, 0xffffff, 1)

    this.jumpGaugeFill = this.add.rectangle(
      width / 2 - gaugeWidth / 2,
      height / 2 - 100,
      0,
      gaugeHeight - 4,
      0x00ff00,
      1
    )
    this.jumpGaugeFill.setDepth(201)
    this.jumpGaugeFill.setOrigin(0, 0.5)
    this.jumpGaugeFill.setVisible(false)

    this.jumpGaugeText = this.add.text(
      width / 2,
      height / 2 - 130,
      'ジャンプパワー',
      {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
      }
    )
    this.jumpGaugeText.setOrigin(0.5)
    this.jumpGaugeText.setDepth(200)
    this.jumpGaugeText.setVisible(false)
  }
  private scrollBlocks(): void {
    // プレイヤーが歩道エリア内にいる場合はスクロールしない
    if (this.player.x < this.SIDEWALK_WIDTH) {
      return
    }

    // 歩道を出たらフラグを立てる
    if (!this.inCrosswalk) {
      this.inCrosswalk = true
    }

    const width = this.cameras.main.width

    // 白ブロックを左にスクロール
    this.whiteLines.forEach(block => {
      block.x -= this.SCROLL_SPEED

      // 画面左端を超えたら右端に戻す（無限ループ）
      if (block.x < -this.BLOCK_WIDTH / 2) {
        block.x = width + this.BLOCK_WIDTH / 2
      }
    })

    // プレイヤーも一緒に左に移動（ジャンプ中も常に移動）
    this.player.x -= this.SCROLL_SPEED
  }

  private handlePlayerMovement(): void {
    const baseJumpDistance = this.BLOCK_WIDTH + this.BLOCK_GAP  // 基本ジャンプ距離（1ブロック分）
    const minJumpDistance = 60  // 最小ジャンプ距離
    const maxJumpDistance = baseJumpDistance + 100  // 最大ジャンプ距離

    // ジャンプ時間中のスクロール距離を計算（400ms = ジャンプ時間）
    const jumpDuration = 400  // Player.tsのjumpDurationと同じ
    const scrollDuringJump = (this.SCROLL_SPEED * jumpDuration) / 16.67  // 60FPSで計算

    // プレイヤーが白ブロックエリアにいるかチェック
    const inBlockArea = this.player.x >= this.SIDEWALK_WIDTH

    // キーが押され始めた時の処理
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left) && !this.player.getIsJumping()) {
      this.keyPressStartTime = this.time.now
      this.keyPressDirection = 'left'
      // ゲージ表示
      this.showJumpGauge()
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right) && !this.player.getIsJumping()) {
      this.keyPressStartTime = this.time.now
      this.keyPressDirection = 'right'
      // ゲージ表示
      this.showJumpGauge()
    }

    // キーが離された時の処理
    if (Phaser.Input.Keyboard.JustUp(this.cursors.left) && this.keyPressDirection === 'left' && !this.player.getIsJumping()) {
      const pressDuration = this.time.now - this.keyPressStartTime
      // 押下時間に応じてジャンプ距離を調整（0ms～500msの範囲）
      const ratio = Math.min(pressDuration / 500, 1)
      const jumpDistance = minJumpDistance + (baseJumpDistance - minJumpDistance) * ratio

      // スクロール分を考慮した目標位置
      const compensation = inBlockArea ? scrollDuringJump : 0
      const targetX = this.player.x - jumpDistance + compensation

      // 歩道エリアより左には行かない
      if (targetX >= 50) {
        this.currentBlockIndex = Math.max(0, this.currentBlockIndex - 1)
        this.player.jump(targetX)
      }
      this.keyPressDirection = ''
      // ゲージ非表示
      this.hideJumpGauge()
    } else if (Phaser.Input.Keyboard.JustUp(this.cursors.right) && this.keyPressDirection === 'right' && !this.player.getIsJumping()) {
      const pressDuration = this.time.now - this.keyPressStartTime
      // 押下時間に応じてジャンプ距離を調整（0ms～500msの範囲）
      const ratio = Math.min(pressDuration / 500, 1)
      const jumpDistance = minJumpDistance + (baseJumpDistance - minJumpDistance) * ratio

      // スクロール分を考慮した目標位置
      const compensation = inBlockArea ? scrollDuringJump : 0
      const targetX = this.player.x + jumpDistance + compensation

      // 画面右端は制限しない（無限に進める）
      this.currentBlockIndex++
      this.player.jump(targetX)
      this.keyPressDirection = ''
      // ゲージ非表示
      this.hideJumpGauge()
    }
  }

  private updateJumpGauge(): void {
    if (this.keyPressDirection !== '') {
      const pressDuration = this.time.now - this.keyPressStartTime
      const ratio = Math.min(pressDuration / 500, 1)
      const gaugeWidth = 150

      // ゲージの幅を更新
      this.jumpGaugeFill.width = gaugeWidth * ratio

      // ゲージの色を変更（緑→黄色→赤）
      if (ratio < 0.5) {
        this.jumpGaugeFill.setFillStyle(0x00ff00)  // 緑
      } else if (ratio < 0.8) {
        this.jumpGaugeFill.setFillStyle(0xffff00)  // 黄色
      } else {
        this.jumpGaugeFill.setFillStyle(0xff0000)  // 赤
      }

      // ゲージをプレイヤーの上に配置
      const gaugeY = this.player.y - 80
      this.jumpGaugeBackground.setPosition(this.player.x, gaugeY)
      this.jumpGaugeFill.setPosition(this.player.x - gaugeWidth / 2, gaugeY)
      this.jumpGaugeText.setPosition(this.player.x, gaugeY - 30)
    }
  }

  private showJumpGauge(): void {
    this.jumpGaugeBackground.setVisible(true)
    this.jumpGaugeFill.setVisible(true)
    this.jumpGaugeText.setVisible(true)
  }

  private hideJumpGauge(): void {
    this.jumpGaugeBackground.setVisible(false)
    this.jumpGaugeFill.setVisible(false)
    this.jumpGaugeText.setVisible(false)
  }

  private spawnObstacle(): void {
    if (this.isGameOver) return

    // ブロックの上に障害物を配置
    const y = this.GROUND_Y - this.BLOCK_HEIGHT / 2 - 20

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
    body.setVelocityX(-this.SCROLL_SPEED * 60)  // スクロール速度に合わせる

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

  private checkIfPlayerFell(): void {
    // プレイヤーが歩道エリア内にいる場合はチェックしない
    if (this.player.x < this.SIDEWALK_WIDTH) {
      return
    }

    // ジャンプ中はチェックしない（着地してから判定）
    if (this.player.getIsJumping()) {
      return
    }

    // ブロックエリアに入ったら、ブロックの上にいるかチェック
    const playerOnBlock = this.isPlayerOnBlock()

    if (!playerOnBlock) {
      this.gameOver()
    }
  }

  private isPlayerOnBlock(): boolean {
    const tolerance = 20  // 余裕を持たせる（スクロール分も考慮）
    let onBlock = false

    this.whiteLines.forEach(block => {
      const leftEdge = block.x - this.BLOCK_WIDTH / 2
      const rightEdge = block.x + this.BLOCK_WIDTH / 2

      // プレイヤーのX座標がブロックの範囲内にあるかチェック
      if (this.player.x >= leftEdge - tolerance && this.player.x <= rightEdge + tolerance) {
        onBlock = true
      }
    })

    return onBlock
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
