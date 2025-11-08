import Phaser from 'phaser';
import { Eraser } from '../../gameObjects/keshipin/Eraser';

/**
 * 消しピンゲームシーン
 * 机の上で消しゴムを弾いて相手を落とすバトルゲーム
 */
export class KeshiPinScene extends Phaser.Scene {
  // ゲームオブジェクト
  private playerEraser!: Eraser;
  private enemyErasers: Eraser[] = [];
  private desk!: Phaser.GameObjects.Rectangle;
  private deskBounds!: Phaser.Geom.Rectangle;

  // 入力
  private spaceKey!: Phaser.Input.Keyboard.Key;

  // ゲーム状態
  private enemiesRemaining: number = 3;
  private enemyCountText!: Phaser.GameObjects.Text;
  private gameOver: boolean = false;

  // 射撃システム
  private shootPower: number = 0;
  private maxShootPower: number = 800;
  private isCharging: boolean = false;
  private powerBar!: Phaser.GameObjects.Graphics;
  private aimLine!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'KeshiPinScene' });
  }

  /**
   * アセットの読み込み
   */
  preload() {
    // 消しゴムの画像を読み込み
    // TODO: 実際の画像パスに置き換えてください
    // this.load.image('player-eraser', 'assets/eraser-player.png');
    // this.load.image('enemy-eraser', 'assets/eraser-enemy.png');
  }

  /**
   * ゲームオブジェクトの作成と初期化
   */
  create() {
    // 背景の設定
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x87CEEB).setOrigin(0, 0);
    // 机の作成
    this.createDesk();
    // プレイヤー消しゴムの作成
    this.createPlayer();
    // 敵消しゴムの作成
    this.createEnemies();
    // UIの作成
    this.createUI();
    // 入力の設定
    this.setupInput();
    // 衝突判定の設定
    this.setupCollisions();
    // パワーバーとエイムラインの作成
    this.createAimingGraphics();
  }

  /**
   * 机の作成
   */
  private createDesk() {
    // 画面サイズを取得
    const { width, height } = this.scale;
    const deskWidth = width * 0.8;
    const deskHeight = height * 0.8;

    // 机の表面（茶色）
    this.desk = this.add.rectangle(
      width / 2,
      height / 2,
      deskWidth,
      deskHeight,
      0x8B4513
    ).setStrokeStyle(4, 0x000000);


    // 机の境界を保存（衝突判定用）
    // 境界は左上座標とサイズで定義する
    const deskX = width / 2 - deskWidth / 2;  // 左端のX座標
    const deskY = height / 2 - deskHeight / 2; // 上端のY座標
    this.deskBounds = new Phaser.Geom.Rectangle(deskX, deskY, deskWidth, deskHeight);
  }

  /**
   * プレイヤー消しゴムの作成
   */
  private createPlayer() {
    // 机の範囲内でランダムな位置を取得
    const { x, y } = this.getRandomPositionOnDesk();

    // プレイヤー消しゴムをインスタンス化（青色）
    this.playerEraser = new Eraser(this, x, y, 0x4169E1);
  }

  /**
   * 敵消しゴムの作成
   */
  private createEnemies() {
    // 3体の敵をランダムな位置に配置
    for (let i = 0; i < 3; i++) {
      // ランダムな位置を取得
      const { x, y } = this.getRandomPositionOnDesk(100);
      // 敵消しゴムをインスタンス化（赤色）
      const enemy = new Eraser(this, x, y, 0xFF4500);
      // 配列に追加
      this.enemyErasers.push(enemy);
    }
  }

  /**
   * UIの作成
   */
  private createUI() {
    const { width } = this.scale;

    // 残りの敵の数
    this.enemyCountText = this.add.text(20, 50, `残り敵: ${this.enemiesRemaining}`, {
      fontSize: '24px',
      color: '#000000',
      fontFamily: 'Arial'
    });

    // 操作説明
    this.add.text(width / 2, 20, 'スペースキー長押しでチャージ、離して発射！', {
      fontSize: '20px',
      color: '#000000',
      fontFamily: 'Arial'
    }).setOrigin(0.5, 0);
  }

  /**
   * 入力の設定
   */
  private setupInput() {
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // スペースキー押下開始
    this.spaceKey.on('down', () => {
      if (!this.gameOver && this.canShoot()) {
        this.isCharging = true;
        this.shootPower = 0;
      }
    });

    // スペースキー離す
    this.spaceKey.on('up', () => {
      if (this.isCharging && !this.gameOver) {
        this.shootEraser();
        this.isCharging = false;
        this.shootPower = 0;
      }
    });
  }

  /**
   * 衝突判定の設定
   */
  private setupCollisions() {
    // プレイヤーと各敵の衝突
    this.enemyErasers.forEach(enemy => {
      this.physics.add.collider(this.playerEraser, enemy);
    });

    // 敵同士の衝突
    for (let i = 0; i < this.enemyErasers.length; i++) {
      for (let j = i + 1; j < this.enemyErasers.length; j++) {
        this.physics.add.collider(this.enemyErasers[i], this.enemyErasers[j]);
      }
    }
  }

  /**
   * エイムラインとパワーバーの作成
   */
  private createAimingGraphics() {
    this.aimLine = this.add.graphics();
    this.powerBar = this.add.graphics();
  }

  /**
   * 射撃可能か確認
   */
  private canShoot(): boolean {
    // プレイヤーが静止している場合のみ射撃可能
    return this.playerEraser.isStationary();
  }

  /**
   * 消しゴムを発射
   */
  private shootEraser() {
    // マウスポインターの位置を取得
    const pointer = this.input.activePointer;
    // プレイヤーからマウスへの角度を計算
    const angle = Phaser.Math.Angle.Between(
      this.playerEraser.x,
      this.playerEraser.y,
      pointer.x,
      pointer.y
    );

    // パワーを速度に変換（最小100、最大maxShootPower）
    const velocity = Phaser.Math.Clamp(this.shootPower, 100, this.maxShootPower);

    // 消しゴムを発射
    this.playerEraser.shoot(angle, velocity);
  }

  /**
   * 机の範囲内でランダムな位置を計算
   * @param margin 机の端からの余白（ピクセル）
   * @returns { x: number, y: number } ランダムな座標
   */
  private getRandomPositionOnDesk(margin: number = 50): { x: number; y: number } {
    // 机の幅と高さを取得
    const deskWidth = this.deskBounds.width;
    const deskHeight = this.deskBounds.height;

    // 机の左上の座標 + ランダムな値（余白を考慮）
    const x = this.deskBounds.x + margin + Math.random() * (deskWidth - margin * 2);
    const y = this.deskBounds.y + margin + Math.random() * (deskHeight - margin * 2);

    return { x, y };
  }

  /**
   * 毎フレームの更新処理
   */
  update() {
    if (this.gameOver) return;

    // チャージ中の処理
    if (this.isCharging) {
      this.shootPower = Math.min(this.shootPower + 10, this.maxShootPower);
      this.drawAimLine();
      this.drawPowerBar();
    } else {
      this.aimLine.clear();
      this.powerBar.clear();
    }

    // 机から落ちた消しゴムをチェック
    this.checkFallenErasers();
  }

  /**
   * エイムラインを描画
   */
  private drawAimLine() {
    this.aimLine.clear();

    const pointer = this.input.activePointer;
    const angle = Phaser.Math.Angle.Between(
      this.playerEraser.x,
      this.playerEraser.y,
      pointer.x,
      pointer.y
    );

    const length = 100;
    const endX = this.playerEraser.x + Math.cos(angle) * length;
    const endY = this.playerEraser.y + Math.sin(angle) * length;

    this.aimLine.lineStyle(3, 0xFFFF00, 1);
    this.aimLine.beginPath();
    this.aimLine.moveTo(this.playerEraser.x, this.playerEraser.y);
    this.aimLine.lineTo(endX, endY);
    this.aimLine.strokePath();
  }

  /**
   * パワーバーを描画
   */
  private drawPowerBar() {
    this.powerBar.clear();

    const { width, height } = this.scale;
    const barX = width / 2 - 100;
    const barY = height - 50;
    const barWidth = 200;
    const barHeight = 20;

    // 背景
    this.powerBar.fillStyle(0x333333, 0.8);
    this.powerBar.fillRect(barX, barY, barWidth, barHeight);

    // パワー表示
    const powerRatio = this.shootPower / this.maxShootPower;
    const color = powerRatio < 0.5 ? 0x00FF00 : powerRatio < 0.8 ? 0xFFFF00 : 0xFF0000;

    this.powerBar.fillStyle(color, 1);
    this.powerBar.fillRect(barX, barY, barWidth * powerRatio, barHeight);
  }

  /**
   * 机から落ちた消しゴムをチェック
   */
  private checkFallenErasers() {
    // プレイヤーが落ちたかチェック
    if (!Phaser.Geom.Rectangle.Contains(this.deskBounds, this.playerEraser.x, this.playerEraser.y)) {
      this.endGame(false);
      return;
    }

    // 敵が落ちたかチェック（後ろから順にチェック）
    for (let i = this.enemyErasers.length - 1; i >= 0; i--) {
      const enemy = this.enemyErasers[i];
      
      // 机の範囲外に出たら削除
      if (enemy.active && !Phaser.Geom.Rectangle.Contains(this.deskBounds, enemy.x, enemy.y)) {
        enemy.destroy();
        this.enemyErasers.splice(i, 1);  // 配列から削除
        this.enemiesRemaining--;
        this.enemyCountText.setText(`残り敵: ${this.enemiesRemaining}`);

        // 全ての敵を倒したら勝利
        if (this.enemiesRemaining === 0) {
          this.endGame(true);
        }
      }
    }
  }

  /**
   * ゲーム終了処理
   */
  private endGame(victory: boolean) {
    this.gameOver = true;

    const { width, height } = this.scale;

    // 結果表示
    const resultText = victory ? '勝利！' : '机から落ちた！';
    const resultColor = victory ? '#FFD700' : '#FF0000';

    this.add.text(
      width / 2,
      height / 2 - 50,
      resultText,
      {
        fontSize: '64px',
        color: resultColor,
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 6
      }
    ).setOrigin(0.5);

    // メニューに戻るボタン
    const backButton = this.add.text(
      width / 2,
      height / 2 + 100,
      'メニューに戻る',
      {
        fontSize: '28px',
        color: '#ffffff',
        backgroundColor: '#4CAF50',
        padding: { x: 20, y: 10 }
      }
    ).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('MenuScene');
      })
      .on('pointerover', () => {
        backButton.setScale(1.1);
      })
      .on('pointerout', () => {
        backButton.setScale(1);
      });
  }
}
