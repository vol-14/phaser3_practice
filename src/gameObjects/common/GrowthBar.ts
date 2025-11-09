import Phaser from 'phaser';

export class GrowthBar extends Phaser.GameObjects.Container {
    private bg: Phaser.GameObjects.Graphics;
    private fg: Phaser.GameObjects.Graphics;
    private barWidth: number;
    private barHeight: number;
    private percentText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number, width: number = 240, height: number = 20) {
        super(scene, x, y);
        this.barWidth = width;
        this.barHeight = height;

        this.bg = scene.add.graphics();
        this.fg = scene.add.graphics();

        // 背景枠
        this.bg.fillStyle(0x222222, 0.6);
        this.bg.fillRoundedRect(-this.barWidth / 2, -this.barHeight / 2, this.barWidth, this.barHeight, 6);
        this.bg.lineStyle(2, 0x000000, 0.8);
        this.bg.strokeRoundedRect(-this.barWidth / 2, -this.barHeight / 2, this.barWidth, this.barHeight, 6);

        // 初期の前景（進捗）を空で描画
        this.fg.fillStyle(0x8ef0a6, 1);
        this.fg.fillRoundedRect(-this.barWidth / 2 + 2, -this.barHeight / 2 + 2, 0, this.barHeight - 4, 4);

        // パーセント表示
        this.percentText = scene.add.text(this.barWidth / 2 + 12, 0, '0%', {
            fontFamily: 'Arial',
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#000000'
        }).setOrigin(0, 0.5);

        this.add([this.bg, this.fg, this.percentText]);
    }

    /**
     * 0-1 の値で進捗を更新する
     */
    public setProgress(ratio: number) {
        const clamped = Phaser.Math.Clamp(ratio, 0, 1);
        // 前景を再描画
        this.fg.clear();
        this.fg.fillStyle(0x8ef0a6, 1);
        const innerW = (this.barWidth - 4) * clamped;
        this.fg.fillRoundedRect(-this.barWidth / 2 + 2, -this.barHeight / 2 + 2, innerW, this.barHeight - 4, 4);

        const pct = Math.round(clamped * 100);
        this.percentText.setText(`${pct}%`);
    }

    // コンテナ破棄時にグラフィックスも破棄
    public destroy(fromScene?: boolean) {
        this.bg.destroy();
        this.fg.destroy();
        this.percentText.destroy();
        super.destroy(fromScene);
    }
}
