type PopupOption = {
  x: number;
  y: number;
}

export class Popup {
  div: HTMLElement = null;
  contentDiv: HTMLElement = null;
  mousedown: boolean = false;
  x: number = 0;
  y: number = 0;

  constructor(option: PopupOption) {
    this.div = document.createElement('div');
    this.div.className = 'popup';
    this.div.style.left = `${option.x}px`;
    this.div.style.top = `${option.y}px`;
    this.div.id = 'hello';

    this.div.addEventListener('mousedown', (event) => {
      this.mousedown = true;
      this.x = event.pageX;
      this.y = event.pageY;
    });

    this.div.addEventListener('mouseup', (_event) => {
      this.mousedown = false;
    });

    this.div.addEventListener('mousemove', (event) => {
      if (this.mousedown === false) return;
      const dx = event.pageX - this.x;
      const dy = event.pageY - this.y;
      this.x = event.pageX;
      this.y = event.pageY;
      this.div.style.left = `${parseInt(this.div.style.left) + dx}px`;
      this.div.style.top = `${parseInt(this.div.style.top) + dy}px`;
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
  }
}

