import Phaser from 'phaser'

export class Player extends Phaser.GameObjects.Sprite {
  private speed: number = 4
  private isJumping: boolean = false
  private jumpStartY: number = 0

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player', 0)

    // スプライトのスケールを調整（512x1024 → 約80x160に縮小）
    this.setScale(0.15)
    this.setDepth(10)

    scene.add.existing(this)
    scene.physics.add.existing(this)

    // 物理ボディのサイズを調整
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(400, 800)
    body.setOffset(50, 150)
  }

  playWalkAnimation(): void {
    this.play('walk', true)
  }

  stopAnimation(): void {
    this.stop()
    this.setFrame(1) // 中央のフレーム（立ち姿）
  }

  jump(targetX: number, onComplete?: () => void): void {
    if (this.isJumping) return

    this.isJumping = true
    const startY = this.y
    const startX = this.x

    const jumpHeight = 60  // ジャンプの高さ
    const jumpDuration = 400  // ジャンプ時間

    // X方向の移動とY方向のアーチを同時に実行
    this.scene.tweens.add({
      targets: this,
      x: targetX,  // 横方向に移動
      duration: jumpDuration,
      ease: 'Linear'
    })

    // Y方向の上下移動（放物線アーチ）
    this.scene.tweens.add({
      targets: this,
      y: startY - jumpHeight,  // 上に飛ぶ
      duration: jumpDuration / 2,
      ease: 'Quad.easeOut',
      onComplete: () => {
        // 降りる
        this.scene.tweens.add({
          targets: this,
          y: startY,  // 元の高さに戻る
          duration: jumpDuration / 2,
          ease: 'Quad.easeIn',
          onComplete: () => {
            this.isJumping = false
            if (onComplete) onComplete()
          }
        })
      }
    })

    // スケールアニメーション（押しつぶし効果）
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.13,  // 少し縦に縮む
      duration: jumpDuration / 2,
      ease: 'Quad.easeOut',
      yoyo: true  // 元に戻る
    })
  }

  getIsJumping(): boolean {
    return this.isJumping
  }

  moveLeft(): void {
    this.x -= this.speed
  }

  moveRight(): void {
    this.x += this.speed
  }

  setSpeed(speed: number): void {
    this.speed = speed
  }
}
