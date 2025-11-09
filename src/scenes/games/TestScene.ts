// Phaserライブラリをインポート（ゲームエンジン本体）
import Phaser from 'phaser';

/**
 * TestScene - テスト用のゲームシーン
 * Phaserのシーンは「ゲームの1画面」を表す
 * 例: タイトル画面、ゲーム画面、結果画面など
 */
export class TestScene extends Phaser.Scene {
  /**
   * コンストラクタ - シーンが作成されるときに最初に呼ばれる
   */
  constructor() {
    // 親クラス(Phaser.Scene)のコンストラクタを呼び出す
    // key: このシーンを識別するための名前（他のシーンから呼び出すときに使う）
    super({ key: 'TestScene' });
  }

  /**
   * preload() - ゲーム開始前に実行される関数
   * 画像、音声などのアセット（素材）を読み込む場所
   * 例: this.load.image('player', 'assets/player.png')
   */
  preload() {
    // 今回は画像を使わないので空っぽ
  }

  /**
   * create() - preloadの後に1回だけ実行される関数
   * ゲームオブジェクト（キャラクター、背景など）を作成・配置する場所
   */
  create() {
    // --- 画面サイズの取得 ---
    // this.scale: 画面のスケール情報を持つオブジェクト
    // width: 画面の幅（ピクセル）、height: 画面の高さ（ピクセル）
    // 分割代入で2つの値を一度に取得
    const { width, height } = this.scale;

    // --- テキストの表示 ---
    // this.add.text(x座標, y座標, 表示する文字列, スタイル設定)
    this.add.text(
      width / 2,        // x座標: 画面の中央（幅の半分）
      height / 2,       // y座標: 画面の中央（高さの半分）
      'Hello Phaser!',  // 表示する文字列
      {
        fontSize: '32px',   // フォントサイズ
        color: '#000000'    // 文字色（黒色）
      }
    ).setOrigin(0.5);  // 原点を中心に設定（0.5, 0.5 = 中心）
                       // デフォルトは左上(0, 0)なので、これで真ん中に配置される

    // --- プレイヤー（四角形）の作成 ---
    // this.add.rectangle(x座標, y座標, 幅, 高さ, 色)
    const player = this.add.rectangle(
      width / 2,      // x座標: 画面の横中央
      height - 100,   // y座標: 画面の下から100ピクセル上
      50,             // 幅: 50ピクセル
      50,             // 高さ: 50ピクセル
      0x00ff00        // 色: 16進数カラーコード（緑色）
    );

    // --- 物理エンジンの有効化 ---
    // this.physics.add.existing(オブジェクト): 
    // 既存のゲームオブジェクトに物理演算の機能を追加
    // これにより、重力や衝突判定などが使えるようになる
    this.physics.add.existing(player);

    // --- キーボード入力の設定 ---
    // this.input.keyboard: キーボード入力を管理するオブジェクト
    // createCursorKeys(): 矢印キー（↑↓←→）を自動的に設定してくれる便利メソッド
    // ?: オプショナルチェーン（keyboardがnullの場合エラーを防ぐ）
    const cursors = this.input.keyboard?.createCursorKeys();

    // --- データの保存 ---
    // update()関数でも使いたい変数をシーンのデータストアに保存
    // this.data.set(キー名, 値): データを保存
    // 通常のプロパティ（this.player）でも可能だが、this.dataを使うとデータ管理が明確になる
    this.data.set('player', player);      // プレイヤーオブジェクトを保存
    this.data.set('cursors', cursors);    // カーソルキー情報を保存
  }

  /**
   * update() - 毎フレーム（1秒間に約60回）実行される関数
   * ゲームのメインループ。キャラクターの移動、衝突判定などを処理
   * 60FPSなら1秒間に60回呼ばれる
   */
  update() {
    // --- 保存したデータの取得 ---
    // this.data.get(キー名): 保存したデータを取得
    // as 型名: TypeScriptの型アサーション（この変数はこの型だと明示）
    const player = this.data.get('player') as Phaser.GameObjects.Rectangle;
    const cursors = this.data.get('cursors') as Phaser.Types.Input.Keyboard.CursorKeys;

    // --- データの存在チェック ---
    // もしplayerやcursorsがnullやundefinedなら、処理を中断
    // !: 否定演算子（「存在しない」という意味）
    // return: 関数を終了して抜ける
    if (!player || !cursors) return;

    // --- プレイヤーの移動処理 ---
    // 移動速度（1フレームあたり何ピクセル動くか）
    const speed = 5;

    // 左矢印キーが押されているか判定
    // cursors.left.isDown: 左キーが押されている間true
    if (cursors.left.isDown) {
      // player.x: プレイヤーのx座標（横位置）
      // -= speed: 現在の位置から5ピクセル左に移動
      player.x -= speed;
    }
    // else if: 左が押されていない場合、右キーをチェック
    else if (cursors.right.isDown) {
      // += speed: 現在の位置から5ピクセル右に移動
      player.x += speed;
    }

    // 上矢印キーが押されているか判定
    if (cursors.up.isDown) {
      // player.y: プレイヤーのy座標（縦位置）
      // -= speed: 現在の位置から5ピクセル上に移動
      // 注意: Phaserでは上方向がマイナス、下方向がプラス
      player.y -= speed;
    }
    // 下矢印キーが押されているか判定
    else if (cursors.down.isDown) {
      // += speed: 現在の位置から5ピクセル下に移動
      player.y += speed;
    }

    // このupdate()関数が1秒間に約60回実行されることで、
    // 滑らかな移動アニメーションが実現される
  }
}