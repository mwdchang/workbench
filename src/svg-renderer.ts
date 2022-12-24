import * as d3 from 'd3';
import {D3DragEvent} from 'd3';
import {EventEmitter} from './event-emitter';
import { Point, Item } from "./types";

const translate = (x: number, y: number) => `translate(${x}, ${y})`;

/**
 * Handles object rendering and sending upstream the interaction semantics.
 */
export class SVGRenderer extends EventEmitter {
  svg: d3.Selection<any, any, SVGElement, any> = null
  surface: d3.Selection<any, any, SVGElement, any> = null

  init(elem: HTMLDivElement) {
    this.svg = d3.select(elem).append('svg');
    this.svg.style('width', '100%').style('height', '100%');
    this.surface = this.svg.append('g');
    this.initializeSurface(); 
  }

  update() {
    this.surface.selectAll<any, Item<any>>('.item-group')
      .attr('transform', d => {
        return translate(d.body.position.x, d.body.position.y);
      })
      .attr('stroke-width', d => {
        return d.selected ? 3 : 1;
      });
  }

  lasso(path: Point[]) {
    this.surface.selectAll('.lasso').remove();

    if (path.length < 2) return;

    this.surface.selectAll('.lasso')
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
    this.surface.append('line')
      .classed('lasso', true)
      .attr('x1', path[0].x)
      .attr('y1', path[0].y)
      .attr('x2', path[path.length - 1].x)
      .attr('y2', path[path.length - 1].y)
      .style('stroke', '#f80')
      .style('stroke-dasharray', '2 2');
  }

  drawItems(items: Item<any>[]) {
    const dragStart = (event: D3DragEvent<any, any, any>) => {
      event.sourceEvent.stopPropagation();
      this.emit('item-drag-start');
    };

    const dragMove = (event: d3.D3DragEvent<any, any, any>, d: Item<any>) => {
      const { x, y, dx, dy } = event;
      this.emit('item-drag-move', { x, y, dx, dy, item: d });
    };

    const dragEnd = (event: d3.D3DragEvent<any, any, any>, d: Item<any>) => {
      const { x, y, dx, dy } = event;
      this.emit('item-drag-end', { x, y, dx, dy, item: d });
    };

    items.forEach(item => {
      const itemG = this.surface.append('g').classed('item-group', true);
      const { x, y } = item.body.position;
      const { max, min } = item.body.bounds;

      itemG.attr('transform', translate(x, y)).datum(item);

      itemG.append('rect')
        .attr('x', -(max.x - min.x) * 0.5)
        .attr('y', -(max.y - min.y) * 0.5)
        .attr('width', max.x - min.x)
        .attr('height', max.y - min.y)
        .attr('fill', '#DD0')
        .attr('stroke', '#BBB');

      const itemDrag = d3.drag()
        .on('start', dragStart)
        .on('drag', dragMove)
        .on('end', dragEnd);
      itemG.call(itemDrag);
    });
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

    this.surface.call(svgDrag);
    this.surface.on('click', () => {
      this.emit('surface-click');
    });

    // Setup zoom
    // FIXME: Maybe do viewport
    const zoomed = ({ transform }) => {
      this.surface.attr('transform', transform);
    }

    const zoom = d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([[0, 0], [800, 400]])
      .on("zoom", zoomed);
    this.svg.call(zoom);
  }
}
