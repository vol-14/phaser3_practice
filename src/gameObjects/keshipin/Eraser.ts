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
   * @param sleeveColor カバー（スリーブ）の色（16進数カラーコード）
   */
  constructor(scene: Phaser.Scene, x: number, y: number, sleeveColor: number = 0x4169E1) {
    // 親クラス(Sprite)のコンストラクタを呼び出し
    // 最初はテクスチャなしで作成
    super(scene, x, y, '');

    // このオブジェクトをシーンに追加
    scene.add.existing(this);
    // 物理エンジンを有効化
    scene.physics.add.existing(this);
    // 消しゴムのサイズを設定
    this.setDisplaySize(40, 60);
    // テクスチャを生成（本体は白、スリーブの色で判別）
    this.createTexture(sleeveColor);
    // 物理設定を適用
    this.setupPhysics();
  }

  /**
   * 消しゴムのテクスチャ（見た目）を作成
   * 真上から見た消しゴム（上部：白い本体、下部：カラーカバー）
   * @param sleeveColor カバーの色（16進数）
   */
  private createTexture(sleeveColor: number): void {
    const width = 40;
    const height = 60;
    const graphics = this.scene.add.graphics();

    // 角丸の半径
    const radius = 6;

    // 消しゴム本体の高さ（上40%が白い部分）
    const bodyHeight = height * 0.4;
    // カバー部分の高さ（下60%）
    const sleeveHeight = height - bodyHeight;
    const sleeveStart = bodyHeight;

    // === 消しゴム本体（白色・上部） ===
    graphics.fillStyle(0xF5F5F5, 1); // オフホワイト
    graphics.fillRoundedRect(0, 0, width, height, radius);

    // // 本体の輪郭線（グレー）
    // graphics.lineStyle(2, 0x999999, 1);
    // graphics.strokeRoundedRect(1, 1, width - 2, height - 1, radius);

    // === カバー（スリーブ）部分 - 下60% ===
    graphics.fillStyle(sleeveColor, 1);
    graphics.fillRect(0, sleeveStart, width, sleeveHeight);

    // 中央の白い部分（40%）
    const centerWidth = width * 0.4;
    const centerX = width * 0.3;
    graphics.fillStyle(0xE0E0E0, 1); // 灰色
    graphics.fillRect(centerX, sleeveStart, centerWidth, sleeveHeight);

    // 描画した内容をテクスチャとして保存
    const textureKey = `eraser-top-view-${sleeveColor}`;
    graphics.generateTexture(textureKey, width, height);

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
