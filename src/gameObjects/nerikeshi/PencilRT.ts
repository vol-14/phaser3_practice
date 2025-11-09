import Phaser from 'phaser';

export class PencilRT {
    private renderTexture: Phaser.GameObjects.RenderTexture;
    private brushCanvas: Phaser.GameObjects.Graphics;
    private eraserCanvas: Phaser.GameObjects.Graphics;
    private eraserPointer: Phaser.GameObjects.Graphics;
    private isDrawing: boolean = false;
    private lastPoint: { x: number; y: number } | null = null;
    private brushSize: number = 3; // パフォーマンス改善のため少し細く
    private eraserSize: number = 20;
    private brushColor: number = 0x333333;
    private brushAlpha: number = 1;
    private minDistance: number = 2; // パフォーマンス改善のため少し大きく

    constructor(scene: Phaser.Scene) {
        // メインの描画キャンバス (RenderTexture)
        this.renderTexture = scene.add.renderTexture(0, 0, scene.scale.width, scene.scale.height);
        this.renderTexture.setOrigin(0, 0);
        this.renderTexture.setDepth(0);

        // ブラシ用のグラフィックス（描画時にテンプレートとして使用）
        this.brushCanvas = scene.add.graphics();
        this.updateBrushCanvas();

        // 消しゴム用のグラフィックス（透明で消すために使用）
        this.eraserCanvas = scene.add.graphics();
        this.updateEraserCanvas();

        // 消しゴムのポインタ表示用グラフィックス
        this.eraserPointer = scene.add.graphics();
        this.eraserPointer.setDepth(2); // 最前面に表示
        this.updateEraserPointer();
    }

    start(x: number, y: number) {
        this.isDrawing = true;
        this.lastPoint = { x, y };
        this.drawAt(x, y);
    }

    move(x: number, y: number) {
        if (!this.isDrawing || !this.lastPoint) return;

        const dist = Phaser.Math.Distance.Between(this.lastPoint.x, this.lastPoint.y, x, y);
        if (dist < this.minDistance) return;

        // 前回の点と今回の点の間を補間して滑らかに
        const points = this.getInterpolatedPoints(this.lastPoint.x, this.lastPoint.y, x, y);
        points.forEach(p => this.drawAt(p.x, p.y));

        this.lastPoint = { x, y };
    }

    end() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.lastPoint = null;
    }

    clear() {
        this.renderTexture.clear();
    }

    // ブラシの太さ、色、不透明度を設定
    setStyle(width: number, color: number, alpha: number = 1) {
        this.brushSize = width;
        this.brushColor = color;
        this.brushAlpha = alpha;
        this.updateBrushCanvas();
    }

    // 消しゴムのサイズを設定
    setEraserSize(size: number) {
        this.eraserSize = size;
        this.updateEraserCanvas();
        // ポインタ表示も更新（位置は次回のeraseAtで与えられるので外観のみ更新）
        this.updateEraserPointer();
    }

    private drawnPoints: Array<{ x: number, y: number }> = [];
    private maxPoints: number = 1000; // パフォーマンスのために保存する点の数を制限

    // 指定位置に円形の消しゴムで消し、接触判定を行う
    eraseAt(x: number, y: number): { x: number, y: number } | null {
        // ポインタのオフセットを定義
        const offsetX = -24;
        const offsetY = -40;

        // オフセットを適用した位置を計算
        const pointerX = x + offsetX;
        const pointerY = y + offsetY;

        // 消しゴムポインタの位置を更新（オフセット込み）
        this.updateEraserPointer(x, y);

        // 表示（ポインタ）と実際の消去で同じ半径を使うように統一
        const eraserRadius = Math.max(15, Math.floor(this.eraserSize * 0.75));

        // まず見た目の範囲で実際にレンダーテクスチャを消去する
        const eraseOffset = eraserRadius;
        this.renderTexture.erase(this.eraserCanvas, pointerX - eraseOffset, pointerY - eraseOffset);

        // 接触した点を全て収集（消しカス生成判定用）
        let contactPoints: Array<{ x: number, y: number }> = [];
        for (const point of this.drawnPoints) {
            const dist = Phaser.Math.Distance.Between(pointerX, pointerY, point.x, point.y);
            if (dist <= eraserRadius) {
                contactPoints.push({ x: point.x, y: point.y });
            }
        }

        if (contactPoints.length > 0) {
            // 接触した点を全て削除（少し広めにして隙間を減らす）
            const safeRadius = eraserRadius * 1.2;
            this.drawnPoints = this.drawnPoints.filter(point =>
                !contactPoints.some(contact =>
                    Phaser.Math.Distance.Between(contact.x, contact.y, point.x, point.y) < safeRadius
                )
            );

            // 最初の接触点を返す（消しかす生成用）
            return contactPoints[0];
        }

        return null;
    }

    private drawAt(x: number, y: number) {
        this.renderTexture.draw(this.brushCanvas, x - this.brushSize / 2, y - this.brushSize / 2);

        // 描画点を記録（最大数を超えないように）
        this.drawnPoints.push({ x, y });
        if (this.drawnPoints.length > this.maxPoints) {
            this.drawnPoints.shift(); // 古い点を削除
        }
    }

    private updateEraserPointer(x?: number, y?: number) {
        this.eraserPointer.clear();

        // ポインタは消去ブラシの輪郭を示すので、eraserSize に連動
        // 表示サイズは消しゴムサイズに連動させる（判定と表示を一致させる）
        const radius = Math.max(15, Math.floor(this.eraserSize * 0.75));
        this.eraserPointer.lineStyle(2, 0x666666, 0.8); // 線をより濃く、太く
        this.eraserPointer.beginPath();
        this.eraserPointer.arc(-24, -40, radius, 0, Math.PI * 2); // オフセットを適用
        this.eraserPointer.strokePath();

        // クロスヘアを追加して中心位置を分かりやすく
        const crossSize = radius * 0.3;
        this.eraserPointer.lineStyle(1, 0x666666, 0.5);
        this.eraserPointer.beginPath();
        this.eraserPointer.moveTo(20 - crossSize, 20);
        this.eraserPointer.lineTo(20 + crossSize, 20);
        this.eraserPointer.moveTo(20, 20 - crossSize);
        this.eraserPointer.lineTo(20, 20 + crossSize);
        this.eraserPointer.strokePath();

        if (x !== undefined && y !== undefined) {
            // ポインタをマウス位置に表示（オフセットは描画時に既に適用済み）
            this.eraserPointer.setPosition(x, y);
        }
    }

    // ブラシ用のグラフィックスを更新
    private updateBrushCanvas() {
        this.brushCanvas.clear();
        this.brushCanvas.fillStyle(this.brushColor, this.brushAlpha);
        this.brushCanvas.fillCircle(this.brushSize / 2, this.brushSize / 2, this.brushSize / 2);
    }

    // 消しゴム用のグラフィックスを更新
    private updateEraserCanvas() {
        this.eraserCanvas.clear();
        this.eraserCanvas.fillStyle(0xffffff, 1);
        // eraserCanvas の消去半径を表示/判定と一致させる
        const r = Math.max(15, Math.floor(this.eraserSize * 0.75));
        // Canvas 上では中心を (r, r) にして円を描く
        this.eraserCanvas.fillCircle(r, r, r);
    }

    // 2点間を補間して滑らかな線を作る
    private getInterpolatedPoints(x1: number, y1: number, x2: number, y2: number): Array<{ x: number, y: number }> {
        const dist = Phaser.Math.Distance.Between(x1, y1, x2, y2);
        const steps = Math.floor(dist / (this.brushSize / 4));
        if (steps <= 1) return [{ x: x2, y: y2 }];

        const points: Array<{ x: number, y: number }> = [];
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            points.push({
                x: x1 + (x2 - x1) * t,
                y: y1 + (y2 - y1) * t
            });
        }
        return points;
    }

    // パフォーマンス監視用（必要に応じて）
    getCurrentMemoryUsage(): number {
        return this.renderTexture.width * this.renderTexture.height * 4; // RGBA各1バイト
    }
}