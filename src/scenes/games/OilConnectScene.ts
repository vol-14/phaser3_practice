import Phaser from 'phaser';
import { OilDropContainer } from '../../gameObjects/oil/OilDropContainer';
import { spawnOilDrops } from '../../gameObjects/oil/OilDropSpawner';

export const OilConnectScene = {
  key: 'OilConnectScene',

  preload(this: Phaser.Scene) {
    this.load.image('bg', 'assets/images/oil/bg.png');
  },

  create(this: Phaser.Scene) {
    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, 'bg').setDisplaySize(width, height);

    console.log('bg created');

    const soupEllipse = new Phaser.Geom.Ellipse(
      width / 2,
      height / 2 - 20,
      840,
      665,
    );

    const oilDrops = spawnOilDrops(this, soupEllipse, 50);
    oilDrops.forEach(oil => this.input.setDraggable(oil as Phaser.GameObjects.GameObject));

    this.input.on(
      'drag', 
      (
        _pointer: Phaser.Input.Pointer, 
        gameObject: Phaser.GameObjects.GameObject, 
        dragX: number, 
        dragY: number
      ) => {
        const oil = gameObject as OilDropContainer;
        if (Phaser.Geom.Ellipse.Contains(soupEllipse, dragX, dragY)) {
          oil.setPosition(dragX, dragY);
          oil.updateDragState(dragX, dragY);

          const body = oil.body as Phaser.Physics.Arcade.Body;
          body.setVelocity(0, 0);

          for (let i = oilDrops.length - 1; i >= 0; i--) {
            const other = oilDrops[i];
            if (other === oil) continue;

            const dist = Phaser.Math.Distance.Between(oil.x, oil.y, other.x, other.y);

            if (dist < oil.radius * 2) {
              oil.grow(3);
              
              this.tweens.add({
                targets: oil,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 100,
                yoyo: true,
                ease: 'Sine.easeInOut',

              });

              other.destroy();
              oilDrops.splice(i, 1);

              break; // 1体だけ消す
            }
          }

        } else {
          oil.setScale(1, 1);
        }
      }
    );

    this.events.on('update', () => {
      oilDrops.forEach(oil => oil.update());
    });
    
  }
};