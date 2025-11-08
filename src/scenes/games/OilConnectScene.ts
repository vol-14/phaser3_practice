import Phaser from 'phaser';
import { OilDropContainer } from '../../gameObjects/oil/OilDropContainer';

export const OilConnectScene = {
  key: 'OilConnectScene',

  preload(this: Phaser.Scene) {
    this.load.image('bg', 'assets/images/oil/bg.png');
  },

  create(this: Phaser.Scene) {
    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, 'bg').setDisplaySize(width, height);

    console.log('bg created')

    const oil = new OilDropContainer(this, width / 2, height / 2);

    this.input.setDraggable(oil as Phaser.GameObjects.GameObject);


    this.input.on(
        'drag', 
        (
            pointer: Phaser.Input.Pointer, 
            gameObject: Phaser.GameObjects.GameObject, 
            dragX: number, 
            dragY: number
        ) => {
            const oil = gameObject as OilDropContainer;
            oil.setPosition(dragX, dragY);
            const body = (gameObject.body as Phaser.Physics.Arcade.Body);
            body.setVelocity(0, 0);

    }) 

    this.events.on('update', () => {
      oil.update();
    });
    
  }
};