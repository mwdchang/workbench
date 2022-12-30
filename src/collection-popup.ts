import { PopupOptions, Item } from './types';
import { Popup } from './popup';

export class CollectionPopup extends Popup {
  constructor(options: PopupOptions, items: Item<any>[]) {
    super(options);

    const title = document.createElement('div');
    title.textContent = `Create new group - ${items.length} items`;
    this.contentDiv.appendChild(title);

    const input = document.createElement('input');
    input.style.margin = '5px';
    this.contentDiv.appendChild(input);

    for (const item of items) {
      const itemDiv = document.createElement('div');
      itemDiv.textContent = `- ${item}`;
      this.contentDiv.appendChild(itemDiv);
    }

    // Override popup style
    this.div.className = 'popup items-popup';
    this.div.removeChild(this.div.querySelector('button'));

    const footerDiv = document.createElement('div');
    footerDiv.style.display = 'flex';

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.flex = '1';
    closeButton.addEventListener('click', () => {
      this.detatch();
    });
    footerDiv.appendChild(closeButton);

    const okButton = document.createElement('button');
    okButton.textContent = 'Ok';
    okButton.style.flex = '1';
    okButton.addEventListener('click', () => {
      this.emit('create-group', input.value);
      this.detatch();
    });
    footerDiv.appendChild(okButton);
    this.div.appendChild(footerDiv);
    // Done override

  }
}
