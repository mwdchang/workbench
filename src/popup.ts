import { EventEmitter } from "./event-emitter";
import { PopupOptions } from './types';


export class Popup extends EventEmitter {
  div: HTMLElement = null;
  contentDiv: HTMLElement = null;
  mousedown: boolean = false;

  x: number = 0;
  y: number = 0;
  _x: number = 0;
  _y: number = 0;

  constructor(options: PopupOptions) {
    super();
    this.div = document.createElement('div');
    this.div.className = 'popup';
    this.div.style.left = `${options.x}px`;
    this.div.style.top = `${options.y}px`;
    this.div.id = 'hello';

    this.x = options.x;
    this.y = options.y;

    this.div.addEventListener('mousedown', (event) => {
      this.mousedown = true;
      this._x = event.pageX;
      this._y = event.pageY;
    });

    this.div.addEventListener('mouseup', (_event) => {
      this.mousedown = false;
    });

    this.div.addEventListener('mousemove', (event) => {
      if (this.mousedown === false) return;
      const dx = event.pageX - this._x;
      const dy = event.pageY - this._y;
      this._x = event.pageX;
      this._y = event.pageY;

      const newX = parseInt(this.div.style.left) + dx;
      const newY = parseInt(this.div.style.top) + dy;

      this.div.style.left = `${newX}px`;
      this.div.style.top = `${newY}px`;
      this.x = newX;
      this.y = newY;

      this.emit('popup-move', {
        x: this.x,
        y: this.y  
      })
    });

    this.contentDiv = document.createElement('div');
    this.contentDiv.className = 'content';
    this.div.appendChild(this.contentDiv);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', () => {
      this.detatch();
    })
    this.div.appendChild(closeButton);
  }

  attach() {
    if (this.div)
      document.body.appendChild(this.div);
  }

  detatch() {
    if (this.div)
      document.body.removeChild(this.div);
    this.emit('close');
  }
}

