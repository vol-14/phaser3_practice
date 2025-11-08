import Phaser from 'phaser';

export class OilDropContainer extends Phaser.GameObjects.Container {
  oil: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.oil = new Phaser.GameObjects.Graphics(scene);
    this.add(this.oil);

    this.oil.fillStyle(0xffffff, 0.2);
    this.oil.fillCircle(0, 0, 10);

    this.setSize(20, 20);
    this.setInteractive(new Phaser.Geom.Circle(10, 10, 10), Phaser.Geom.Circle.Contains);

    this.body = this.body as Phaser.Physics.Arcade.Body;
    this.body.setCircle(10);
    this.body.setBounce(0.6);
    this.body.setCollideWorldBounds(true);
    this.body.setOffset(0, 0);

    console.log('OilDropContainer created', x, y);
  }

  update() {
    this.oil.clear();
    this.oil.fillStyle(0xffffff, 0.2);
    this.oil.fillCircle(0, 0, 10);
  }
}
