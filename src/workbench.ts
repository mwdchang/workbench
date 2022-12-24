import { SVGRenderer } from './svg-renderer';
// import { Popup } from './popup';
import { inside } from './polygon-intersect';
import { Point, Item, WorkBenchOptions } from './types';
import * as Matter from 'matter-js';

type ItemDragEvent = {
  x: number,
  y: number,
  dx: number,
  dy: number,
  item: Item<any>
}

export class Workbench {
  selectedPath: Point[] = [];
  renderer: SVGRenderer = null;
  items: Item<any>[] = [];
  options: WorkBenchOptions = null;

  // matter-js
  engine: Matter.Engine = null;

  constructor(containerElem: HTMLDivElement, options: WorkBenchOptions) {
    this.renderer = new SVGRenderer(options);
    this.renderer.init(containerElem);
    this.selectedPath = [];

    this.engine = Matter.Engine.create();
    this.engine.gravity.y = 0;

    this.options = options;

    // const testPop = new Popup({ x: 200, y: 200});
    // testPop.attach();
  }

  /**
   * Create the workbench and start the physics engine's animation loop
   **/
  run() {
    const engine = this.engine;
    const renderer = this.renderer;

    this.setupLasso();
    this.setupBounds();

    (function run() {
      window.requestAnimationFrame(run);
      Matter.Engine.update(engine, 1000 / 60);
      renderer.update();
    })(); 
  }


  /**
   * Set up workbench boundary
   */
  setupBounds() {
    const w = this.options.width;
    const h = this.options.height;
    const padding = 2;

    const north = Matter.Bodies.rectangle(0.5 * w, 0, w, padding, { isStatic: true });
    const east = Matter.Bodies.rectangle(w - padding, 0.5 * h, padding, h, { isStatic: true });
    const south = Matter.Bodies.rectangle(0.5 * w, h - padding, w, padding, { isStatic: true });
    const west = Matter.Bodies.rectangle(0, 0.5 * h, padding, h, { isStatic: true });
    Matter.Composite.add(this.engine.world, [north, east, south, west]);
  }

  /**
   * Create the base items. 
   * Each item contains 
   * - The original datum 
   * - A rigid body for physics with positional data
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
        selected: false,
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

    renderer.on('item-drag-end', (_, payload: ItemDragEvent) => {
      const { dx, dy, item } = payload;
      const { x, y } = item.body.position;
      const nX = x + dx;
      const nY = y + dy;

      const fx = item.dx / 500;
      const fy = item.dy / 500;
      Matter.Body.applyForce(item.body, { x: nX, y: nY }, { x: fx, y: fy });
    });


    renderer.drawItems(this.items);
  }

  /**
   * Lasso for selecting multiple items
   **/
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

    renderer.on('surface-drag-end', () => {
      const path = this.selectedPath;
      this.items.forEach(item => {
        if (this.selectedPath.length < 2) return;
        const polygon: [number, number][] = path.map(d => [d.x, d.y]);
        polygon.push([path[0].x, path[0].y]);
        const isInside = inside([item.body.position.x, item.body.position.y], polygon);
        if (isInside) {
          item.selected = true;
        }
      });
    });

    renderer.on('surface-click', () => {
      this.selectedPath = [];
      this.items.forEach(item => {
        item.selected = false;
      });
      renderer.lasso([]);
    });
  }
}
