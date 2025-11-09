import Phaser from 'phaser';

export class Pencil {
    private graphics: Phaser.GameObjects.Graphics;
    private isDrawing: boolean = false;
    private lastPoint: { x: number; y: number } | null = null;
    private lastDotPoint: { x: number; y: number } | null = null;
    private dotsGroup?: Phaser.Physics.Arcade.Group;
    private dotSpacing: number = 8; // px
    // strokes: 配列ごとに一つの筆跡（線）の点列を保持
    private strokes: Array<Array<{ x: number; y: number }>> = [];
    // move 時に即座に描画するための最小距離
    private minSegmentDistance: number = 2;

    constructor(scene: Phaser.Scene, dotsGroup?: Phaser.Physics.Arcade.Group) {
        this.graphics = scene.add.graphics();
        // デフォルトの線スタイル
        this.graphics.lineStyle(4, 0x333333, 1);
        // 既定では描画が最前面に来るように
        this.graphics.setDepth(0);

        this.dotsGroup = dotsGroup;

        // 小さなドット用テクスチャを生成
        const texKey = 'pencilDot';
        if (!scene.textures.exists(texKey)) {
            const size = 10;
            const g = scene.make.graphics({ x: 0, y: 0 });
            g.fillStyle(0x333333, 1);
            g.fillCircle(size / 2, size / 2, size / 2);
            g.generateTexture(texKey, size, size);
            g.destroy();
        }
    }

    start(x: number, y: number) {
        this.isDrawing = true;
        this.lastPoint = { x, y };
        this.lastDotPoint = null;
        // 新しいストロークを開始
        this.strokes.push([{ x, y }]);
        this.graphics.beginPath();
        this.graphics.moveTo(x, y);

        this.addDot(x, y);
    }

    move(x: number, y: number) {
        if (!this.isDrawing || !this.lastPoint) return;
        const dist = Phaser.Math.Distance.Between(this.lastPoint.x, this.lastPoint.y, x, y);
        if (dist < this.minSegmentDistance) return;

        // ストロークに追加
        const currentStroke = this.strokes[this.strokes.length - 1];
        currentStroke.push({ x, y });

        // 即座に一段分だけ描画
        this.graphics.lineStyle(4, 0x333333, 1);
        this.graphics.beginPath();
        const last = this.lastPoint;
        this.graphics.moveTo(last.x, last.y);
        this.graphics.lineTo(x, y);
        this.graphics.strokePath();

        // ドットを間隔をあけて生成（衝突判定用）
        if (!this.lastDotPoint || Phaser.Math.Distance.BetweenPoints(this.lastDotPoint, { x, y }) >= this.dotSpacing) {
            this.addDot(x, y);
        }

        this.lastPoint = { x, y };
    }

    end() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.lastPoint = null;
        this.lastDotPoint = null;
        this.graphics.closePath();
    }

    // シーン切替などで描画をクリアしたい場合に呼ぶ
    clear(clearDots: boolean = false) {
        this.graphics.clear();
        // 再度デフォルトスタイルを設定
        this.graphics.lineStyle(4, 0x333333, 1);

        if (clearDots && this.dotsGroup) {
            this.dotsGroup.clear(true, true);
        }
        // ストロークもクリア
        if (clearDots) this.strokes = [];
    }

    // 任意で線の太さ・色を変えられるユーティリティ
    setStyle(width: number, color: number, alpha: number = 1) {
        this.graphics.lineStyle(width, color, alpha);
    }

    private addDot(x: number, y: number) {
        if (!this.dotsGroup) {
            this.lastDotPoint = { x, y };
            return;
        }

        // create a physics-enabled image in the group
        const img = this.dotsGroup.create(x, y, 'pencilDot') as Phaser.Physics.Arcade.Image;
        img.setOrigin(0.5);
        img.setDepth(0);
        const body = img.body as Phaser.Physics.Arcade.Body | undefined;
        if (body) {
            body.setImmovable(true);
            body.setAllowGravity(false);
            // 物理判定を丸くする
            body.setCircle(Math.max(img.width, img.height) / 2);
        }

        this.lastDotPoint = { x, y };
    }

    // 指定座標を中心に半径 radius 内の点を削除し、Graphics を再描画する
    eraseAt(x: number, y: number, radius: number = 12) {
        if (this.strokes.length === 0) return;

        let changed = false;
        // 各ストロークの点をフィルタ
        this.strokes = this.strokes.map(stroke => {
            const filtered = stroke.filter(p => Phaser.Math.Distance.Between(p.x, p.y, x, y) > radius);
            if (filtered.length !== stroke.length) changed = true;
            return filtered;
        });

        if (!changed) return;

        // 再描画
        this.graphics.clear();
        this.graphics.lineStyle(4, 0x333333, 1);
        for (const stroke of this.strokes) {
            if (stroke.length < 2) continue;
            this.graphics.beginPath();
            this.graphics.moveTo(stroke[0].x, stroke[0].y);
            for (let i = 1; i < stroke.length; i++) {
                const a = stroke[i - 1];
                const b = stroke[i];
                // 大きなギャップがある場合は分断して描画
                if (Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y) > this.dotSpacing * 4) {
                    this.graphics.strokePath();
                    this.graphics.beginPath();
                    this.graphics.moveTo(b.x, b.y);
                    continue;
                }
                this.graphics.lineTo(b.x, b.y);
            }
            this.graphics.strokePath();
        }
    }
}
