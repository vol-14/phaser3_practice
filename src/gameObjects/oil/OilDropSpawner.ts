import { OilDropContainer } from './OilDropContainer';
import Phaser from 'phaser';

export function spawnOilDrops(
  scene: Phaser.Scene,
  ellipse: Phaser.Geom.Ellipse,
  count: number
): OilDropContainer[] {
  const oilDrops: OilDropContainer[] = [];

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let placed = false;

    while (!placed && attempts < 1000) {
      const point = Phaser.Geom.Ellipse.Random(ellipse);

      const tooClose = oilDrops.some(existing =>
        Phaser.Math.Distance.Between(existing.x, existing.y, point.x, point.y) < existing.radius * 2
      );

      if (!tooClose) {
        const oil = new OilDropContainer(scene, point.x, point.y);
        scene.add.existing(oil);
        scene.physics.add.existing(oil);
        scene.input.setDraggable(oil);
        oilDrops.push(oil);
        placed = true;
      }

      attempts++;
    }
  }

  return oilDrops;
}
