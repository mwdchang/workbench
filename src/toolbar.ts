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
    if (options.width) {
      this.div.style.width = `${options.width}px`;
    }

    // Left and right panels
    const right = document.createElement('div');
    right.style.display = 'flex';
    right.style['flex-direction'] = 'row';
    right.style['justify-content'] = 'right';

    const left = document.createElement('div');
    right.style.display = 'flex';
    right.style['flex-direction'] = 'row';
    right.style.flex = '1';

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.addEventListener('click', () => {
      this.workbench.saveState();
    });

    const loadButton = document.createElement('button');
    loadButton.textContent = 'Load';
    loadButton.addEventListener('click', () => {
      this.workbench.loadState();
    });

    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.addEventListener('click', () => {
      this.workbench.clear();
    });


    const searchInput = document.createElement('input');
    searchInput.style.width = '20rem';
    searchInput.placeholder = 'Search...';
    searchInput.addEventListener('input', () => {
      let str = searchInput.value;
      debounceSearch(str, this.workbench);
    });

    left.appendChild(saveButton);
    left.appendChild(loadButton);
    left.appendChild(clearButton);
    right.appendChild(searchInput);

    this.div.appendChild(left);
    this.div.appendChild(right);
  }

  setWorkbench(workbench: Workbench) {
    this.workbench = workbench;
  }

  attach() {
    if (this.div)
      document.body.appendChild(this.div);
  }
}
