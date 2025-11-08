import Phaser from 'phaser';
import { Eraser } from '../../gameObjects/nerikeshi/Eraser.ts';
import { EraserPiece } from '../../gameObjects/nerikeshi/EraserPiece.ts';
import { Pencil } from '../../gameObjects/nerikeshi/Pencil.ts';

enum GameMode {
    EraserMode,
    NeriKeshiMode,
    PencilMode
}

export class NeriKeshiScene extends Phaser.Scene {
    private mode: GameMode = GameMode.EraserMode;
    private eraser!: Eraser;
    private neriKeshi!: Eraser;
    private pencil!: Pencil;
    private pencilDots!: Phaser.Physics.Arcade.Group;
    private eraserPieces!: Phaser.Physics.Arcade.Group;

    private modeText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'NeriKeshiScene' });
    }

    preload() {
        // 木目調の机のテクスチャを生成
        if (!this.textures.exists('desk')) {
            const g = this.make.graphics({ x: 0, y: 0 });

            // 木目の基本色（薄い茶色）
            g.fillStyle(0xd4a774);
            g.fillRect(0, 0, 1920, 1080);

            // 木目のパターンを追加
            g.lineStyle(1, 0xc49b6a, 0.4);
            for (let x = 0; x < 1920; x += 20) {
                // ランダムな曲線で木目を表現
                g.beginPath();
                g.moveTo(x, 0);
                for (let y = 0; y < 1080; y += 100) {
                    const xOffset = Phaser.Math.Between(-10, 10);
                    g.lineTo(x + xOffset, y);
                }
                g.stroke();
            }

            // より濃い木目を追加
            g.lineStyle(2, 0xb38b5d, 0.2);
            for (let x = 0; x < 1920; x += 150) {
                g.beginPath();
                g.moveTo(x + Phaser.Math.Between(-20, 20), 0);
                for (let y = 0; y < 1080; y += 200) {
                    const xOffset = Phaser.Math.Between(-40, 40);
                    g.lineTo(x + xOffset, y);
                }
                g.stroke();
            }

            g.generateTexture('desk', 1920, 1080);
            g.destroy();
        }

        // ノート背景のテクスチャを生成
        if (!this.textures.exists('notebook')) {
            const g = this.make.graphics({ x: 0, y: 0 });

            // 白い背景
            g.fillStyle(0xffffff);
            g.fillRect(0, 0, 1920, 1080);

            // 薄いグレーの罫線
            g.lineStyle(1, 0x999999, 0.3);
            const lineSpacing = 30;
            for (let y = lineSpacing; y < 1080; y += lineSpacing) {
                g.lineBetween(0, y, 1920, y);
            }

            // 左端の薄い黒線
            g.lineStyle(2, 0x000000, 0.2);
            g.lineBetween(960, 0, 960, 1080);

            g.generateTexture('notebook', 1920, 1080);
            g.destroy();
        }
    }

    create() {
        // 木目調の机を追加（最背面）
        this.add.image(960, 540, 'desk');

        // ノート背景を追加（その上に）
        const notebook = this.add.image(960, 540, 'notebook');
        notebook.setScale(0.9); // ノートを少し小さくして机が見えるように
        // 消しゴム（擦る用）
        this.eraser = new Eraser(this, 200, 300);
        this.add.existing(this.eraser);

        // ねり消し（吸収して大きくなるオブジェクト）
        this.neriKeshi = new Eraser(this, 400, 300, true);
        this.add.existing(this.neriKeshi);

        // えんぴつ（線を描く）
        this.pencilDots = this.physics.add.group();
        this.pencil = new Pencil(this, this.pencilDots);

        // 消しかすグループ（物理付き）
        this.eraserPieces = this.physics.add.group();

        // ねり消しと消しかすの接触検出
        this.physics.add.overlap(this.neriKeshi, this.eraserPieces, (_neri, piece) => {
            // piece を破棄してねり消しを成長させる
            const p = piece as Phaser.GameObjects.GameObject & { destroy: () => void };
            this.neriKeshi.grow(1); // デフォルトの成長率で成長
            p.destroy();
        });

        // 消しゴムと鉛筆のドット（ストローク）を接触検出 -> ドットを破棄して消しかすを生成
        this.physics.add.overlap(this.eraser, this.pencilDots, (_eraser, dot) => {
            const d = dot as Phaser.GameObjects.GameObject & { destroy: () => void } & any;
            // spawnPiece はドット位置で発生
            this.spawnPiece(d.x, d.y);
            // ドットの近傍を鉛筆から消す
            this.pencil.eraseAt(d.x, d.y, 12);
            d.destroy();
        });

        // 入力処理（ドラッグで擦る、スペースでモード切替）
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.mode === GameMode.EraserMode) {
                this.eraser.setPosition(pointer.x, pointer.y);
            } else if (this.mode === GameMode.NeriKeshiMode) {
                this.neriKeshi.setPosition(pointer.x, pointer.y);
            } else if (this.mode === GameMode.PencilMode) {
                this.pencil.start(pointer.x, pointer.y);
            }
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (!pointer.isDown) return;
            if (this.mode === GameMode.EraserMode) {
                this.eraser.setPosition(pointer.x, pointer.y);
            } else if (this.mode === GameMode.NeriKeshiMode) {
                this.neriKeshi.setPosition(pointer.x, pointer.y);
            } else if (this.mode === GameMode.PencilMode) {
                this.pencil.move(pointer.x, pointer.y);
            }
        });

        this.input.on('pointerup', () => {
            if (this.mode === GameMode.PencilMode) {
                this.pencil.end();
            }
        });

        this.input.keyboard?.on('keydown-SPACE', () => {
            // 3モードを循環
            if (this.mode === GameMode.EraserMode) this.mode = GameMode.NeriKeshiMode;
            else if (this.mode === GameMode.NeriKeshiMode) this.mode = GameMode.PencilMode;
            else this.mode = GameMode.EraserMode;

            // モード切替時に鉛筆描画が残るとまずい場合は必要に応じてクリア
            if (this.mode !== GameMode.PencilMode) {
                // 鉛筆モード以外に切り替えたら描画を終了
                this.pencil.end();
            }

            this.updateModeText();
        });

        // モード表示用の背景四角と文字
        this.modeText = this.add.text(1650, 20, '', {
            fontFamily: 'Arial',
            fontSize: '50px',
            fontStyle: 'bold',
            color: '#000000'
        });
        // 操作説明
        this.add.text(1600, 100, 'スペースでモード切替', {
            fontFamily: 'Arial',
            fontSize: '30px',
            color: '#333333'
        });
        this.updateModeText();
    }

    private spawnPiece(x: number, y: number) {
        const piece = new EraserPiece(this, x, y);
        this.add.existing(piece);
        this.eraserPieces.add(piece);
        const body = piece.body as Phaser.Physics.Arcade.Body | undefined;
        if (body) {
            body.setVelocity(Phaser.Math.Between(-15, 15), Phaser.Math.Between(-15, 15)); // より遅い動き
            body.setBounce(0.2); // バウンドも控えめに
            body.setCollideWorldBounds(true);
            body.setDrag(20); // 徐々に減速するように
        }
    }

    private updateModeText() {
        if (!this.modeText) return;

        const padding = 15;

        // まず現在のテキストを非表示に
        this.modeText.setVisible(false);

        // テキストと色を決定
        let modeName = '不明';
        let bgColor = 0xffffff;
        let borderColor = 0x000000;
        let textColor = '#000000';

        if (this.mode === GameMode.EraserMode) {
            modeName = '消しゴム';
            bgColor = 0xffffff;
            borderColor = 0x000000;
            textColor = '#000000';
        } else if (this.mode === GameMode.NeriKeshiMode) {
            modeName = 'ねり消し';
            bgColor = 0x000000;
            borderColor = 0xffffff;
            textColor = '#ffffff';
        } else if (this.mode === GameMode.PencilMode) {
            modeName = 'えんぴつ';
            // 鉛筆モードはやや黄色めの背景
            bgColor = 0xfff0b3;
            borderColor = 0x000000;
            textColor = '#000000';
        }

        this.modeText.setText(modeName);

        // 背景と枠線を描画
        const g = this.add.graphics();
        g.clear();
        g.fillStyle(bgColor);
        g.fillRect(
            this.modeText.x - padding,
            this.modeText.y - padding,
            this.modeText.width + padding * 2,
            this.modeText.height + padding * 2
        );

        g.lineStyle(3, borderColor);
        g.strokeRect(
            this.modeText.x - padding,
            this.modeText.y - padding,
            this.modeText.width + padding * 2,
            this.modeText.height + padding * 2
        );

        // テキストを表示して前面に
        this.modeText.setVisible(true);
        this.modeText.setColor(textColor);
        this.modeText.setFontStyle('bold');
        this.modeText.setDepth(1); // テキストを最前面に
    }

    update() {
        // ここは軽量に保つ
    }
}
