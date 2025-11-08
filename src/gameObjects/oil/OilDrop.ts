export class OilDrop extends Phaser.GameObjects.Graphics {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setPosition(x, y);
    this.setVisible(true);
    this.setInteractive(new Phaser.Geom.Circle(0, 0, 10), Phaser.Geom.Circle.Contains);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(10);
    body.setBounce(0.6);
    body.setCollideWorldBounds(true);
    body.setOffset(-10, -10);

    this.setDepth(2);
    this.fillStyle(0xffffff, 0.2);
    this.fillCircle(0, 0, 10);

    console.log('OilDrop created', x, y);
  }

  squish() {
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.8,
      scaleX: 1.2,
      duration: 200,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  update() {
    this.clear();
    this.fillStyle(0xffffff, 0.2);
    this.fillCircle(0, 0, 10);
  }
}
