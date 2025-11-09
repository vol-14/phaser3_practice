import Phaser from 'phaser';

export class OilDropContainer extends Phaser.GameObjects.Container {
  oil: Phaser.GameObjects.Graphics;
  public radius = 10

  private lastDragX = 0;
  private lastDragY = 0;
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.oil = new Phaser.GameObjects.Graphics(scene);
    this.add(this.oil);

    this.oil.fillStyle(0xffffff, 0.2);
    this.oil.fillCircle(this.radius, this.radius, this.radius);

    this.setSize(this.radius * 2, this.radius * 2);
    this.setInteractive(new Phaser.Geom.Circle(this.radius, this.radius, this.radius), Phaser.Geom.Circle.Contains);

    this.body = this.body as Phaser.Physics.Arcade.Body;
    this.body.setCircle(this.radius);
    this.body.setBounce(0.6);
    this.body.setCollideWorldBounds(true);
    this.body.setOffset(0, 0);

    console.log('OilDropContainer created', x, y);
  }

  update() {
    this.oil.clear();
    this.oil.fillStyle(0xffffff, 0.2);
    this.oil.fillCircle(0, 0, this.radius);
  }

  updateDragState(dragX: number, dragY: number) {

    const dx = dragX - this.lastDragX;
    const dy = dragY - this.lastDragY;
    const moved = Math.abs(dx) + Math.abs(dy);

    if (moved > 0.5) {
      const shakeX = Math.sin(dragX * 0.2) * 0.15;
      const shakeY = Math.cos(dragY * 0.2) * 0.15;
      this.setScale(1 + shakeX, 0.9 + shakeY);
      
      const intensity = Math.abs(shakeX) + Math.abs(shakeY);
      this.oil.clear();
      this.oil.fillStyle(0xffffff, 0.2 + intensity);
    } else {
      this.setScale(1, 1);
      this.oil.clear();
      this.oil.fillStyle(0xffffff, 0.2);
    }

    this.oil.fillCircle(this.radius, this.radius, this.radius);

    this.lastDragX = dragX;
    this.lastDragY = dragY;

    console.log('yure');
  }

  grow(amount: number) {
    this.radius += amount;

    this.oil.clear();
    this.oil.fillStyle(0xffffff, 0.2);
    this.oil.fillCircle(this.radius, this.radius, this.radius);
    this.oil.setPosition(-this.radius, -this.radius);

    this.setSize(this.radius * 2, this.radius * 2);
    this.setInteractive(new Phaser.Geom.Circle(this.radius, this.radius, this.radius), Phaser.Geom.Circle.Contains);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(this.radius);
    body.setOffset(-this.radius, -this.radius);
  }

}
