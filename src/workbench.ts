import { EventEmitter } from './event-emitter';
import { SVGRenderer } from './svg-renderer';
import { Point, Item } from './types';
import * as Matter from 'matter-js';

type ItemDragEvent = {
  x: number,
  y: number,
  dx: number,
  dy: number,
  item: Item<any>
}

export class Workbench extends EventEmitter {
  selectedPath: Point[] = [];
  renderer: SVGRenderer = null;
  items: Item<any>[] = [];

  // matter-js
  engine: Matter.Engine = null;

  constructor(containerElem: HTMLDivElement) {
    super();
    this.renderer = new SVGRenderer();
    this.renderer.init(containerElem);
    this.selectedPath = [];

    this.engine = Matter.Engine.create();
    this.engine.world.gravity.y = 0;
  }

  /**
   * Create the workbench and start the physics engine's animation loop
   **/
  run() {
    const engine = this.engine;
    const renderer = this.renderer;

    this.setupLasso();
    (function run() {
      window.requestAnimationFrame(run);
      Matter.Engine.update(engine, 1000 / 60);
      renderer.update();
    })(); 
  }

  /**
   * Create the base items
   */
  setItems(items: any[]) {
    const renderer = this.renderer;
    const engine = this.engine;

    this.items = items.map((d, i) => {
      const x = 50;
      const y = 50 + 50 * i;
      const width = 40;
      const height = 40;

      const body = Matter.Bodies.rectangle(x, y, width, height, { 
        friction: 0.8, frictionAir: 0.1 
      });
      Matter.Composite.add(engine.world, [body]);
      
      return {
        id: i,
        body: body, 
        rawData: d
      };
    });

    renderer.on('item-drag-move', (_, payload: ItemDragEvent) => {
      const { dx, dy, item } = payload;
      const { x, y } = item.body.position;
      item.dx = dx;
      item.dy = dy;
      Matter.Body.setPosition(item.body, { x: x + dx, y: y + dy });
    });

    renderer.on('item-drag-move', (_, payload: ItemDragEvent) => {
      const { dx, dy, item } = payload;
      const { x, y } = item.body.position;
      const nX = x + dx;
      const nY = y + dy;
      Matter.Body.applyForce(item.body, { x: nX, y: nY }, { x: item.dx/800, y: item.dy/800 });
    });


    renderer.drawItems(this.items);
  }

  setupLasso() {
    const renderer = this.renderer;
    renderer.on('surface-drag-start', () => {
      this.selectedPath = [];
    });

    renderer.on('surface-drag-move', (_, data) => {
      const { x, y } = data;

      // Don't push unless there is enough distanc3
      const len = this.selectedPath.length - 1;
      if (len < 1) {
        this.selectedPath.push({ x, y });
      } else {
        const lastX = this.selectedPath[len].x;
        const lastY = this.selectedPath[len].y;
        const dist = Math.sqrt( (lastX - x) * (lastX - x) + (lastY - y) * (lastY - y));
        if (dist < 15) return;
        this.selectedPath.push({ x, y });
      }
      renderer.lasso(this.selectedPath);
    });
  }
}
