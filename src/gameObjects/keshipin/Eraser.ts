import Phaser from 'phaser';

/**
 * 消しゴムクラス
 * プレイヤーと敵の両方で使用可能な消しゴムオブジェクト
 */
export class Eraser extends Phaser.Physics.Arcade.Sprite {
  /**
   * コンストラクタ
   * @param scene このオブジェクトが属するシーン
   * @param x 初期X座標
   * @param y 初期Y座標
   * @param color 消しゴムの色（16進数カラーコード）
   */
  constructor(scene: Phaser.Scene, x: number, y: number, color: number = 0x4169E1) {
    // 親クラス(Sprite)のコンストラクタを呼び出し
    // 最初はテクスチャなしで作成
    super(scene, x, y, '');

    // このオブジェクトをシーンに追加
    scene.add.existing(this);
    // 物理エンジンを有効化
    scene.physics.add.existing(this);
    // 消しゴムのサイズを設定
    this.setDisplaySize(40, 60);
    // テクスチャを生成（色付きの四角形）
    this.createTexture(color);
    // 物理設定を適用
    this.setupPhysics();
  }

  /**
   * 消しゴムのテクスチャ（見た目）を作成
   * @param color 消しゴムの色
   */
  private createTexture(color: number): void {
    // 一時的にGraphicsオブジェクトを作成して四角形を描画
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color, 1);  // 色と不透明度を設定
    graphics.fillRect(0, 0, 40, 60);  // 四角形を描画
    // 描画した内容をテクスチャとして保存
    const textureKey = `eraser-${color}`;
    graphics.generateTexture(textureKey, 40, 60);
    // Graphicsオブジェクトは不要なので削除
    graphics.destroy();
    // 生成したテクスチャを自分に適用
    this.setTexture(textureKey);
  }

  /**
   * 物理設定を適用
   */
  private setupPhysics(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (body) {
      // 画面の端で跳ね返らない
      body.setCollideWorldBounds(false);
      // 反発係数（0.8 = 衝突時に80%の速度を保つ）
      body.setBounce(0.8);
      // 抵抗（徐々に減速する）
      body.setDrag(100);
      // 最大速度
      body.setMaxVelocity(600);
    }
  }

  /**
   * 消しゴムが静止しているか判定
   * @returns true: 静止している, false: 動いている
   */
  public isStationary(): boolean {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      // x方向とy方向の速度が両方とも10未満なら静止とみなす
      return Math.abs(body.velocity.x) < 10 && Math.abs(body.velocity.y) < 10;
    }
    return false;
  }

  /**
   * 指定した方向と速度で消しゴムを発射
   * @param angle 発射角度（ラジアン）
   * @param speed 発射速度
   */
  public shoot(angle: number, speed: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      // 角度と速度から速度ベクトルを計算して設定
      this.scene.physics.velocityFromRotation(angle, speed, body.velocity);
    }
  }
}
