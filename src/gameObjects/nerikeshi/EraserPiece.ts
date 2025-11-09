import Phaser from 'phaser';

export class EraserPiece extends Phaser.GameObjects.Sprite {
    private static readonly TEXTURE_KEY = 'eraserPiece';

    constructor(scene: Phaser.Scene, x: number, y: number) {
        EraserPiece.createTexture(scene);
        super(scene, x, y, EraserPiece.TEXTURE_KEY);
        scene.physics.add.existing(this);
    }

    private static createTexture(scene: Phaser.Scene) {
        if (!scene.textures.exists(this.TEXTURE_KEY)) {
            const g = scene.make.graphics({ x: 0, y: 0 });

            // より大きく、さらに細長い形状のパスを作成
            const points: Phaser.Math.Vector2[] = [];
            const segments = Phaser.Math.Between(12, 16);
            const baseRadiusX = 16 ;  // 横方向の半径（細長さの源）
            const baseRadiusY = 3;   // 縦方向の半径（細くする）
            const centerX = 16;      // テクスチャ幅の中心
            const centerY = 6;       // テクスチャ高さの中心

            // 基本の回転角度（向きのばらつき）
            const rotation = Phaser.Math.FloatBetween(0, Math.PI * 2);

            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                // より穏やかな変形
                const varianceX = Phaser.Math.FloatBetween(0.92, 1.08);
                const varianceY = Phaser.Math.FloatBetween(0.9, 1.1);

                // 滑らかな波効果を小さめに
                const waveEffect = Math.sin(angle * 2) * 0.7;

                // 楕円ベースの座標計算（横を大きく、縦を小さくすることで細長さを強調）
                const x = centerX + Math.cos(angle + rotation) * baseRadiusX * varianceX + waveEffect * Phaser.Math.FloatBetween(0.8, 1.2);
                const y = centerY + Math.sin(angle + rotation) * baseRadiusY * varianceY + waveEffect * 0.25 * Phaser.Math.FloatBetween(0.8, 1.2);

                points.push(new Phaser.Math.Vector2(x, y));
            }

            // より柔らかい色で塗りつぶし
            g.fillStyle(0x444444, 0.9);

            // なめらかな輪郭を描画
            g.beginPath();
            g.moveTo(points[0].x, points[0].y);
            for (let i = 0; i < points.length; i++) {
                const next = points[(i + 1) % points.length];
                g.lineTo(next.x, next.y);
            }
            g.closePath();
            g.fill();

            // 柔らかさを表現する微細な影（中心付近に薄く）
            for (let i = 0; i < 4; i++) {
                const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
                const d = Phaser.Math.FloatBetween(0.5, 3);
                const sx = centerX + Math.cos(a) * d;
                const sy = centerY + Math.sin(a) * d;
                g.fillStyle(0x333333, 0.25);
                g.fillCircle(sx, sy, 1);
            }

            // テクスチャは横長（幅32, 高さ12）に変更
            g.generateTexture(this.TEXTURE_KEY, 32, 12);
            g.destroy();
        }
    }
}
