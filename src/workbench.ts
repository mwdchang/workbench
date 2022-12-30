import { SVGRenderer } from './svg-renderer';
import { Popup } from './popup';
import { CollectionPopup } from './collection-popup';
import { inside } from './polygon-intersect';
import { Point, Item, Collection, WorkBenchOptions } from './types';
import * as Matter from 'matter-js';

type CollectionDragEvent = {
  x: number,
  y: number,
  dx: number,
  dy: number,
  collection: Collection<any>
}

type ItemDragEvent = {
  x: number,
  y: number,
  dx: number,
  dy: number,
  item: Item<any>
}

const EPS = 0.00001;

// const origConsole = console.log;
// const benchLog = (...args: any) => {
//   args.unshift('bench');
//   origConsole.apply(console, args);
// }

export class Workbench {
  selectedPath: Point[] = [];
  renderer: SVGRenderer = null;
  items: Item<any>[] = [];
  collections: Collection<any>[] = [];

  options: WorkBenchOptions = null;

  // matter-js
  engine: Matter.Engine = null;


  contextPopup: Popup = null;

  constructor(containerElem: HTMLDivElement, options: WorkBenchOptions) {
    this.renderer = new SVGRenderer(options);
    this.renderer.init(containerElem);
    this.selectedPath = [];

    this.engine = Matter.Engine.create();
    this.engine.gravity.y = 0;
    this.options = options;
  }

  /**
   * Create the workbench and start the physics engine's animation loop
   **/
  run() {
    const engine = this.engine;
    const renderer = this.renderer;

    this.setupBounds();
    this.setupLasso();
    this.setupItemInteractions();
    this.setupCollectionInteractions();

    (function run() {
      window.requestAnimationFrame(run);
      Matter.Engine.update(engine, 1000 / 60);
      renderer.update();
    })(); 
  }


  /**
   * Set up workbench boundary, these are physically impasable blocks
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
   * Item event callbacks
   **/
  setupItemInteractions() {
    const renderer = this.renderer;

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

      if (item.dx === undefined || item.dy === undefined) return;

      const fx = item.dx / 500;
      const fy = item.dy / 500;

      if (Math.abs(fx) < EPS && Math.abs(fy) < EPS) return;

      Matter.Body.applyForce(item.body, { x: nX, y: nY }, { x: fx, y: fy });
    });

    renderer.on('item-click', (_, item: Item<any>) => {
      const popup = new Popup({ x: 200, y: 200 });
      popup.attach();
      popup.on('close', () => {
        this.renderer.unlinkPopup(popup);
      });

      this.renderer.linkPopup(popup, item);
    });
  }


  /**
   * Collection event callbacks
   **/
  setupCollectionInteractions() {
    const renderer = this.renderer;
    renderer.on('collection-drag-move', (_, payload: CollectionDragEvent) => {
      const { dx, dy, collection } = payload;
      const { x, y } = collection.body.position;
      collection.dx = dx;
      collection.dy = dy;
      Matter.Body.setPosition(collection.body, { x: x + dx, y: y + dy });
    });
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
      const x = 50 + 25 * i;
      const y = 50 + 50 * i;
      const width = 40;
      const height = 40;

      const body = Matter.Bodies.rectangle(x, y, width, height, {
        friction: 0.8, frictionAir: 0.01
      });
      Matter.Composite.add(engine.world, [body]);

      return {
        id: i,
        flags: {
          selected: false,
          matched: false
        },
        body: body, 
        rawData: d
      };
    });
    renderer.addItems(this.items);
  }


  /**
   * Context menu for grouping items
   */
  setupCollectionContextPopup() {
    const selectedItems = this.items.filter(d => d.flags.selected === true);
    if (selectedItems.length === 0) return;

    this.contextPopup = new CollectionPopup({
      x: 200,
      y: 200
    }, selectedItems);
    this.contextPopup.attach();

    // create new group
    // 1. reset items flags and remove from physics engine
    // 2. remove items from renderer
    // 3. transfer items to new group
    // 4. add group to physics engine
    this.contextPopup.on('create-group', (_eventName, groupName) => {
      console.log('group name', groupName);
      selectedItems.forEach(item => {
        item.flags.selected = false;
        item.flags.matched = false;
        Matter.World.remove(this.engine.world, item.body);
      });
      this.renderer.removeItems(selectedItems);

      const ids = selectedItems.map(d => d.id);
      this.items = this.items.filter(d => {
        return !ids.includes(d.id);
      });
      console.log('remainin items', this.items.length, this.items.map(d => d.rawData));

      // Transfer items to group
      const body = Matter.Bodies.rectangle(200, 200, 50, 50, { 
        friction: 0.8, frictionAir: 0.01 
      });
      Matter.Composite.add(this.engine.world, [body]);

      const group: Collection<any> = {
        id: groupName,
        flags: {
          matched: false
        },
        body: body,
        children: selectedItems.map(d => d.rawData)
      };
      this.collections.push(group);
      this.renderer.addCollections([group]);

      // clean up lasso
      this.selectedPath = [];
      this.renderer.lasso([]);
      this.contextPopup = null;
    });

    this.contextPopup.on('close', () => {
      this.selectedPath = [];
      this.renderer.lasso([]);
      this.contextPopup = null;
    });
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
      // clean up
      if (this.contextPopup) {
        this.contextPopup.detatch();
      }

      const path = this.selectedPath;
      this.items.forEach(item => {
        if (this.selectedPath.length < 2) return;
        const polygon: [number, number][] = path.map(d => [d.x, d.y]);
        polygon.push([path[0].x, path[0].y]);
        const isInside = inside([item.body.position.x, item.body.position.y], polygon);
        if (isInside) {
          item.flags.selected = true;
        }
      });

      // show context menu
      this.setupCollectionContextPopup();
    });

    renderer.on('surface-click', () => {
      this.selectedPath = [];
      this.items.forEach(item => {
        item.flags.selected = false;
      });

      renderer.lasso([]);
    });
  }

  // FIXME
  // - add collection search
  // - add levenshtein
  search(str: string) {
    if (!str || str === '') {
      this.items.forEach(item => {
        item.flags.matched = false;
      });
      this.collections.forEach(collection => {
        collection.flags.matched = false;
      });
      return;
    }

    this.items.forEach(item => {
      if (item.rawData.author.includes(str) || item.rawData.title.includes(str)) {
        item.flags.matched = true;
      }
    });

    this.collections.forEach(collection => {
      let found = false;
      collection.children.forEach(item => {
        if (item.author.includes(str) || item.title.includes(str)) {
          found = true;
        }
      });
      if (found) {
        collection.flags.matched = true;
      }
    });
  }

  clear() {
    console.log('Clear all...');

    // Clear the physics engine
    Matter.Composite.clear(this.engine.world, true, true);
    // this.engine.world.bodies.forEach((body) => {
    //   Matter.Composite.remove(this.engine.world, body);
    // });
    // Matter.Engine.clear(this.engine);
    this.renderer.clear();

    this.items = [];
    this.collections = [];
    this.selectedPath = [];
  }

  saveState() {
    const itemsPayload = this.items.map(item => {
      const { max, min } = item.body.bounds;

      return {
        id: item.id,
        rawData: item.rawData,
        bodyData: {
          x: item.body.position.x,
          y: item.body.position.y,
          width: (max.x - min.x),
          height: (max.y - min.y)
        }
      };
    });

    const collectionsPayload = this.collections.map(collection => {
      const { max, min } = collection.body.bounds;
      return {
        id: collection.id,
        children: collection.children,
        bodyData: {
          x: collection.body.position.x,
          y: collection.body.position.y,
          width: (max.x - min.x),
          height: (max.y - min.y)
        }
      };
    });

    localStorage.setItem('workbench', JSON.stringify({
      items: itemsPayload,
      collections: collectionsPayload
    }));
  }

  loadState() {
    this.clear();
    const dataStr = localStorage.getItem('workbench');
    const data = JSON.parse(dataStr);
    console.log('loading', data);

    const items = data.items;
    const collections = data.collections;

    // Restore items
    items.forEach((item: any) => {
      const { x, y, width, height } = item.bodyData;
      const body = Matter.Bodies.rectangle(x, y, width, height, {
        friction: 0.8, frictionAir: 0.01
      });
      Matter.Composite.add(this.engine.world, [body]);

      this.items.push({
        id: item.id,
        flags: {
          selected: false,
          matched: false
        },
        body: body,
        rawData: item.rawData
      });
    });
    this.renderer.addItems(this.items);

    // Restore collections
    collections.forEach((collection: any) => {
      const { x, y, width, height } = collection.bodyData;
      const body = Matter.Bodies.rectangle(x, y, width, height, {
        friction: 0.8, frictionAir: 0.01
      });
      console.log('>>', x, y, width, height);
      Matter.Composite.add(this.engine.world, [body]);

      this.collections.push({
        id: collection.id,
        flags: {
          matched: false
        },
        body: body,
        children: collection.children
      });
    });
    this.renderer.addCollections(this.collections);
  }
}
