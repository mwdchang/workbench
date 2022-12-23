import * as d3 from 'd3';
import {EventEmitter} from './event-emitter';
import { Point } from "./types";

export class SVGRenderer extends EventEmitter {
  svg: d3.Selection<any, any, SVGElement, any> = null

  init(elem: HTMLDivElement) {
    this.svg = d3.select(elem).append('svg');
    this.svg.style('width', '100%').style('height', '100%');

    this.initializeSurface(); 
  }

  lasso(path: Point[]) {
    this.svg.selectAll('.lasso').remove();
    this.svg.selectAll('.lasso')
      .data(path)
      .enter()
      .append('circle')
      .classed('lasso', true)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', (_, i) => {
        if (i === 0) return 5;
        return 2;
      })
      .attr('fill', (_, i) => {
        if (i === 0) return '#369';
        return '#888'
      });
    this.svg.append('line')
      .classed('lasso', true)
      .attr('x1', path[0].x)
      .attr('y1', path[0].y)
      .attr('x2', path[path.length - 1].x)
      .attr('y2', path[path.length - 1].y)
      .style('stroke', '#f80')
      .style('stroke-dasharray', '2 2');
  }

  addItems(items: any[]) {
  }

  /**
   * Prepare the workbench surface for lasso-dragging interaction
   **/
  initializeSurface() {
    const dragStart = () => {
      this.emit('surface-drag-start');
    };

    const dragMove = (event: d3.D3DragEvent<any, any, any>) => {
      const x = event.x;
      const y = event.y;
      this.emit('surface-drag-move', { x, y });
    };

    const dragEnd = () => {
      this.emit('surface-drag-end');
    };

    const svgDrag = d3.drag()
      .on('start', dragStart)
      .on('drag', dragMove)
      .on('end', dragEnd);

    this.svg.call(svgDrag);
  }

}

