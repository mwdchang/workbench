import { EventEmitter } from './event-emitter';
import { SVGRenderer } from './svg-renderer';
import { Point } from './types';

export class Workbench extends EventEmitter {
  selectedPath: Point[] = [];
  renderer: SVGRenderer = null;
  items: any[] = [];

  constructor(containerElem: HTMLDivElement) {
    super();
    this.renderer = new SVGRenderer();
    this.renderer.init(containerElem);
    this.selectedPath = [];
  }

  run() {
    this.setupItems();
    this.setupLasso();
  }

  setItems(items: any[]) {
    this.items = items;
  }

  setupItems() {
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
