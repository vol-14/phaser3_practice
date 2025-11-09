import Phaser from 'phaser';

export class Eraser extends Phaser.GameObjects.Sprite {
    private isNeriKeshi: boolean;
    private static readonly ERASER_KEY = 'eraser';
    private static readonly NERIKESHI_KEY = 'nerikeshi';

    constructor(scene: Phaser.Scene, x: number, y: number, isNeriKeshi: boolean = false) {
        // テクスチャの生成
        Eraser.createTextures(scene);

        super(scene, x, y, isNeriKeshi ? Eraser.NERIKESHI_KEY : Eraser.ERASER_KEY);
        this.isNeriKeshi = isNeriKeshi;
        scene.physics.add.existing(this);
        this.setInteractive();

        // 初期スケールと角度
        if (this.isNeriKeshi) {
            this.setScale(0.8); // ねり消しは少し小さめ
            this.setAlpha(1); // 完全に不透明
        } else {
            this.setScale(0.8);
            this.setAngle(60); // 消しゴムを少し傾ける
        }
    }

    /**
     * 現在の成長率（0.0 - 1.0）を返す。
     * 0 は初期スケール、1 は最大スケールに対応する。
     */
    public getGrowthRatio(): number {
        const currentScale = this.scaleX || Eraser.INITIAL_SCALE;
        const ratio = (currentScale - Eraser.INITIAL_SCALE) / (Eraser.MAX_SCALE - Eraser.INITIAL_SCALE);
        return Phaser.Math.Clamp(ratio, 0, 1);
    }

    private static createTextures(scene: Phaser.Scene) {
        // 通常の消しゴムのテクスチャ
        if (!scene.textures.exists(this.ERASER_KEY)) {
            const g = scene.make.graphics({ x: 0, y: 0 });

            // 消しゴム本体（白）
            g.fillStyle(0xffffff, 1);
            g.fillRect(0, 0, 120, 60);

            // 青いストライプ（2本）
            g.fillStyle(0x4169e1, 1);
            g.fillRect(40, 0, 80, 20);  // 左側のストライプ
            g.fillRect(40, 40, 80, 20);  // 右側のストライプ

            // 黒いストライプ（1本）
            g.fillStyle(0x000000, 1);
            g.fillRect(40, 20, 80, 20);

            // 外枠
            g.lineStyle(2, 0x000000, 1);
            g.strokeRect(0, 0, 120, 60);

            g.generateTexture(this.ERASER_KEY, 120, 60);
            g.destroy();
        }

        // ねり消しのテクスチャ
        if (!scene.textures.exists(this.NERIKESHI_KEY)) {
            const g2 = scene.make.graphics({ x: 0, y: 0 });

            // より滑らかな形状の頂点を生成
            const points: Phaser.Math.Vector2[] = [];
            const segments = 32; // より多くの頂点でさらに滑らかに
            const baseRadius = 40;

            // より滑らかな波効果の生成
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                // よりマイルドな変形
                const variance = Phaser.Math.FloatBetween(0.95, 1.05);
                // 3つの異なる周波数の波を組み合わせてより自然な揺らぎを作る
                const waveEffect1 = Math.sin(angle * 1.5) * 2;
                const waveEffect2 = Math.sin(angle * 2.5) * 1.5;
                const waveEffect3 = Math.sin(angle * 3.5) * 1;
                const radius = baseRadius * variance + waveEffect1 + waveEffect2 + waveEffect3;

                const x = 40 + Math.cos(angle) * radius;
                const y = 40 + Math.sin(angle) * radius;
                points.push(new Phaser.Math.Vector2(x, y));
            }

            // より柔らかい印象の色で塗りつぶし
            g2.fillStyle(0x333333, 1);
            g2.beginPath();
            g2.moveTo(points[0].x, points[0].y);

            // より滑らかな曲線を描画
            points.forEach((point, i) => {
                const next = points[(i + 1) % points.length];
                if (i === 0) g2.moveTo(point.x, point.y);
                g2.lineTo(next.x, next.y);
            });

            g2.closePath();
            g2.fill();

            // より柔らかい印象の凹凸を表現
            for (let i = 0; i < 12; i++) {
                const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                const distance = Phaser.Math.FloatBetween(10, 30);
                const x = 40 + Math.cos(angle) * distance;
                const y = 40 + Math.sin(angle) * distance;
                // より薄い影で柔らかさを表現
                g2.fillStyle(0x222222, 0.6);
                g2.fillCircle(x, y, Phaser.Math.FloatBetween(6, 8));
            }

            g2.generateTexture(this.NERIKESHI_KEY, 80, 80);
            g2.destroy();
        }
    }

    private growPoints: Phaser.Math.Vector2[] = [];
    private currentGrowthPhase: number = 0;

    // 初期スケール
    private static readonly INITIAL_SCALE = 0.8;
    // 1回の成長での固定増加量
    private static readonly GROWTH_INCREMENT = 0.00001;
    // 最大スケール
    private static readonly MAX_SCALE = 8.0;

    grow(size: number = 1) {
        // 成長ポイントを初期化（最初の成長時のみ）
        if (this.growPoints.length === 0) {
            const numPoints = Phaser.Math.Between(8, 10);
            for (let i = 0; i < numPoints; i++) {
                const angle = (i / numPoints) * Math.PI * 2;
                const distance = Phaser.Math.FloatBetween(0.8, 1.0);
                this.growPoints.push(new Phaser.Math.Vector2(
                    Math.cos(angle) * distance,
                    Math.sin(angle) * distance
                ));
            }
        }

        // 現在のスケールを取得
        const currentScale = this.scaleX || Eraser.INITIAL_SCALE;

        // 最大スケールを超えないように制限しつつ、固定量を加算
        const growthAmount = Eraser.GROWTH_INCREMENT * Math.min(Math.max(size, 0), 1);
        const targetScale = Math.min(currentScale + growthAmount, Eraser.MAX_SCALE);

        // 成長フェーズをさらに緩やかに更新
        this.currentGrowthPhase += 0.001;

        // より穏やかな不均一な拡大を適用
        let scaleX = targetScale;
        let scaleY = targetScale;

        this.growPoints.forEach(point => {
            const wave = Math.sin(this.currentGrowthPhase + point.x * 1.5) * 0.002;
            scaleX += wave * point.x;
            scaleY += wave * point.y;
        });

        // スケールを適用（より小さなランダム性）
        this.setScale(
            scaleX * Phaser.Math.FloatBetween(0.99, 1.01),
            scaleY * Phaser.Math.FloatBetween(0.99, 1.01)
        );
    }
}
