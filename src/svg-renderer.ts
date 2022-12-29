import * as d3 from 'd3';
import {D3DragEvent} from 'd3';
import {EventEmitter} from './event-emitter';
import { Point, Item, WorkBenchOptions, Collection } from "./types";
import { Popup } from './popup';

const translate = (x: number, y: number) => `translate(${x}, ${y})`;

/**
 * Handles object rendering and sending upstream the interaction semantics.
 */
export class SVGRenderer extends EventEmitter {
  svg: d3.Selection<any, any, SVGElement, any> = null
  surface: d3.Selection<any, any, SVGElement, any> = null
  options: WorkBenchOptions = null
  zoomObj: { x: number, y: number, k: number} = { x: 0, y: 0, k: 1 }
  multiplier = 1.25;

  linkMap: Map<Popup, Item<any>> = new Map()

  constructor(options: WorkBenchOptions) {
    super();
    this.options = options;
  }

  init(elem: HTMLDivElement) {
    this.svg = d3.select(elem).append('svg');
    this.svg.style('width', '100%').style('height', '100%');
    this.surface = this.svg.append('g');

    // Hack viewport/viewbox
    this.options.width *= this.multiplier;
    this.options.height *= this.multiplier;
    this.svg.attr('viewBox', `0 0 ${this.options.width} ${this.options.height}`);
    this.svg.attr('preserveAspectRatio', 'xMinYMin slice');

    this.surface.append('rect')
      .classed('surface-panel', true)
      .attr('x', -1)
      .attr('y', -1)
      .attr('width', this.options.width + 1) 
      .attr('height', this.options.height+ 1) 
      .attr('fill', '#FFF')
      .attr('opacity', 0);

    this.initializeSurface(); 
  }

  /**
   * This is basically the main update loop for non-empheral objects. Changes to positions, status, 
   * and other visual artifacts should be reflected here.
   */
  update() {
    this.surface.selectAll<any, Item<any>>('.item-group')
      .attr('transform', d => {
        return translate(d.body.position.x, d.body.position.y);
      })
      .attr('stroke-width', d => {
        return d.flags.selected ? 3 : 1;
      });

    this.surface.selectAll<any, Collection<any>>('.collection-group')
      .attr('transform', d => {
        return translate(d.body.position.x, d.body.position.y);
      });

    this.surface.selectAll('.match-marker').remove();
    this.surface.selectAll<any, Item<any>>('.item-group').each((d, i, g) => {
      if (d.flags.matched) {
        const { max, min } = d.body.bounds;
        d3.select(g[i]).append('circle')
          .classed('match-marker', true)
          .attr('cx', (max.x - min.x) * 0.5)
          .attr('cy', -(max.y - min.y) * 0.5)
          .attr('r', 8)
          .attr('fill', '#f20')
          .attr('stroke', '#FFFFFF')
          .attr('stroke-width', 2);
      }
    });
    this.drawLinks();
  }

  clear() {
    this.surface.selectAll('*').remove();
  }

  /**
   * item work in virtual coordinate
   * screenPos works in screen coordinate
   */
  drawLinks() {
    this.surface.selectAll('.link').remove();

    const zoomObj = this.zoomObj;
    for (const [popup, item] of this.linkMap) {
      const x1 = item.body.position.x;
      const y1 = item.body.position.y;

      const bounds = popup.div.getBoundingClientRect();

      // Transfrom from screen to surface coord
      let x2 = (popup.x + bounds.width * 0.5 - zoomObj.x) / zoomObj.k;
      let y2 = (popup.y + bounds.height * 0.5 - zoomObj.y) / zoomObj.k;
      x2 *= this.multiplier;
      y2 *= this.multiplier;

      this.surface.append('line')
        .classed('link', true)
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .style('stroke', '#F20');
    }
  }
  linkPopup(popup: Popup, item: Item<any>) {
    this.linkMap.set(popup, item);
  }
  unlinkPopup(popup: Popup) {
    this.linkMap.delete(popup);
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

  // removeCollections(groups:Group<any>[]) {
  // }


  addCollections(collections: Collection<any>[]) {
    const dragStart = (event: D3DragEvent<any, any, any>) => {
      event.sourceEvent.stopPropagation();
      this.emit('collection-drag-start');
    };

    const dragMove = (event: d3.D3DragEvent<any, any, any>, d: Collection<any>) => {
      const { x, y, dx, dy } = event;
      this.emit('collection-drag-move', { x, y, dx, dy, collection: d });
    };

    const dragEnd = (event: d3.D3DragEvent<any, any, any>, d: Collection<any>) => {
      const { x, y, dx, dy } = event;
      this.emit('collection-drag-end', { x, y, dx, dy, collection: d });
    };

    collections.forEach(collection => {
      const collectionG = this.surface.append('g').classed('collection-group', true);
      const { x, y } = collection.body.position;
      const { max, min } = collection.body.bounds;

      collectionG.attr('transform', translate(x, y)).datum(collection);

      collectionG.append('rect')
        .attr('x', -(max.x - min.x) * 0.5)
        .attr('y', -(max.y - min.y) * 0.5)
        .attr('width', max.x - min.x)
        .attr('height', max.y - min.y)
        .attr('fill', '#FDD')
        .attr('stroke', '#BBB');

      const offset = 5;
      collectionG.append('foreignObject')
        .attr('x', (max.x - min.x) * 0.5 + offset)
        .attr('y', -(max.y - min.y) * 0.5 - offset)
        .attr('width', 120)
        .attr('height', 50)
        .style('pointer-events', 'none')
        .append('xhtml:div')
        .html(`${collection.id} (${collection.children.length})`);

      const collectionDrag = d3.drag()
        .on('start', dragStart)
        .on('drag', dragMove)
        .on('end', dragEnd);
      collectionG.call(collectionDrag);
    });
  }

  removeItems(items: Item<any>[]) {
    items.forEach(item => {
      this.surface.selectAll<any, Item<any>>('.item-group')
        .filter(d => d.id === item.id)
        .remove();
    });
  }

  addItems(items: Item<any>[]) {
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

      // itemG.append('text')
      //   .attr('x', 25)
      //   .attr('y', 10)
      //   .text(this.options.itemDisplayTextFn(item));

      itemG.on('click', (_event: any) => {
        this.emit('item-click', item);
      });

      const offset = 5;
      itemG.append('foreignObject')
        .attr('x', (max.x - min.x) * 0.5 + offset)
        .attr('y', -(max.y - min.y) * 0.5 - offset)
        .attr('width', 120)
        .attr('height', 100)
        .style('pointer-events', 'none')
        .append('xhtml:div')
        .html(this.options.itemDisplayTextFn(item));

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

    function filterDrag(event: any) {
      event.preventDefault();
      return event.shiftKey;
    }

    const dragStart = () => {
      this.emit('surface-drag-start');
    };

    const dragMove = (event: d3.D3DragEvent<any, any, any>) => {
      const x = (event.x - this.zoomObj.x) / this.zoomObj.k;
      const y = (event.y - this.zoomObj.y) / this.zoomObj.k;
      this.emit('surface-drag-move', { x, y });
    };

    const dragEnd = () => {
      this.emit('surface-drag-end');
    };

    const svgDrag = d3.drag()
      .filter(filterDrag)
      .on('start', dragStart)
      .on('drag', dragMove)
      .on('end', dragEnd);

    this.surface.call(svgDrag);
    this.surface.select('.surface-panel').on('click', (_event: any) => {
      this.emit('surface-click');
    });


    // Setup zoom
    // https://observablehq.com/@d3/pan-zoom-axes
    const { width, height } = this.options;

    // Debugging grids
    const x = d3.scaleLinear().domain([-1, width + 1]).range([-1, width + 1]);
    const y = d3.scaleLinear().domain([-1, height + 1]).range([-1, height + 1]);

    const xAxis = d3.axisBottom(x)
      .ticks(((width + 2) / (height + 2)) * 10)
      .tickSize(height)
      .tickPadding(8 - height)

    const yAxis = d3.axisRight(y)
      .ticks(10)
      .tickSize(width)
      .tickPadding(8 - width)

    const gX = this.svg.append("g").attr("class", "axis axis--x");
    const gY = this.svg.append("g").attr("class", "axis axis--y");

    // Patch grid to a lighter colour

    const zoomed = ({ transform }) => {
      this.surface.attr('transform', transform);
      this.zoomObj.x = transform.x;
      this.zoomObj.y = transform.y;
      this.zoomObj.k = transform.k;

      if (this.options.useGrid) {
        gX.call(xAxis.scale(transform.rescaleX(x)));
        gY.call(yAxis.scale(transform.rescaleY(y)));
        this.svg.selectAll('.axis').selectAll('line').style('opacity', 0.1);
        this.svg.selectAll('.axis').selectAll('text').style('opacity', 0.5);
      }
    }

    if (this.options.useGrid) {
      gX.call(xAxis);
      gY.call(yAxis);
      this.svg.selectAll('.axis').selectAll('line').style('opacity', 0.1);
      this.svg.selectAll('.axis').selectAll('text').style('opacity', 0.5);
    }

    function filterZoom(event: any) {
      // if (!event.shiftKey) return false;
      // return (event.type === 'wheel') && !event.button;
      // return (event.button === 0 || event.button === 1);
      event.preventDefault();
      return (!event.ctrlKey || event.type === 'wheel') && !event.button;
    }

    const zoom = d3.zoom()
      .scaleExtent([1, 5])
      .translateExtent([[0, 0], [width, height]])
      .filter(filterZoom)
      .on("zoom", zoomed);
    this.svg.call(zoom);
  }
}
