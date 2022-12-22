import { EventEmitter } from './event-emitter.js';
import * as d3 from 'd3';

type Point = {
  x: number,
  y: number
}

export class Workbench extends EventEmitter {
  svg: d3.Selection<any, any, SVGElement, any> = null
  selectedPath: Point[] = []

  constructor(svg: d3.Selection<any, any, SVGElement, any>) {
    super();
    this.svg = svg;
    this.selectedPath = [];
  }

  initialize() {
    console.log(d3);
    this.initializeSurface();
  }

  /**
   * Prepare the workbench surface for lasso-dragging interaction
   **/
  initializeSurface() {
    const dragStart = () => {
      this.selectedPath = [];
      this.emit('workbench-drag-start');
    };

    const dragMove = (event: d3.D3DragEvent<any, any, any>) => {
      const x = event.x;
      const y = event.y;
      
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
      this.emit('workbench-drag-move');
    };

    const dragEnd = () => {
      this.emit('workbench-drag-end');
    };

    const svgDrag = d3.drag()
      .on('start', dragStart)
      .on('drag', dragMove)
      .on('end', dragEnd);

    this.svg.call(svgDrag);
  }
}
