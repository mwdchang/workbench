import {EventEmitter} from "./event-emitter";
import { PopupOptions } from './types';
import { Workbench } from './workbench';


let toolbarTimerId = null;
const debounceSearch = (str: string, workbench: Workbench) => {
  if (toolbarTimerId) {
    window.clearTimeout(toolbarTimerId);
  }
  toolbarTimerId = window.setTimeout(() => {
    workbench.search(str);
  }, 500);
}


export class Toolbar extends EventEmitter {
  div: HTMLElement = null;
  workbench: Workbench = null;
  x: number = 0;
  y: number = 0;

  constructor(options: PopupOptions) {
    super();
    this.x = options.x;
    this.y = options.y;

    this.div = document.createElement('div');
    this.div.className = 'toolbar';
    this.div.style.left = `${options.x}px`;
    this.div.style.top = `${options.y}px`;

    const searchInput = document.createElement('input');
    searchInput.placeholder = 'Search...';
    searchInput.addEventListener('input', () => {
      let str = searchInput.value;
      debounceSearch(str, this.workbench);
    });
    this.div.appendChild(searchInput);
  }

  setWorkbench(workbench: Workbench) {
    this.workbench = workbench;
  }

  attach() {
    if (this.div)
      document.body.appendChild(this.div);
  }
}
