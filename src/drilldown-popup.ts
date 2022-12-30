import { PopupOptions, Item } from './types';
import { Popup } from './popup';

export class DrilldownPopup extends Popup {
  activeTab: string = 'annotation';
  item: Item<any> = null;

  constructor(options: PopupOptions, item: Item<any>) {
    super(options);

    this.item = item;
    this.div.className = 'popup drilldown-popup';

    const tabGroup = document.createElement('div');
    tabGroup.className = 'tab-group';

    const annotationTab = document.createElement('div');
    annotationTab.className = 'tab';
    annotationTab.textContent = 'Annotation';

    const viewerTab = document.createElement('div');
    viewerTab.className = 'tab';
    viewerTab.textContent = 'Viewer';

    const resetTab = () => {
      [annotationTab, viewerTab].forEach(d => {
        d.className = 'tab';
      });
    };

    annotationTab.addEventListener('click', () => {
      resetTab();
      annotationTab.className = 'tab active';
      this.activeTab = 'annotation';
      this.showContent();
    });
    viewerTab.addEventListener('click', () => {
      resetTab();
      viewerTab.className = 'tab active';
      this.activeTab = 'viewer';
      this.showContent();
    });


    tabGroup.appendChild(annotationTab);
    tabGroup.appendChild(viewerTab);

    // Override
    this.contentDiv.appendChild(tabGroup);


    annotationTab.className = 'tab active';
    this.showContent();
  }

  showContent() {
    const t = this.contentDiv.querySelector('.tab-content');
    if (t) {
      this.contentDiv.removeChild(t);
    }
    switch (this.activeTab) {
      case 'annotation':
        this.showAnnotation();
        break;
      case 'viewer':
        this.showViewer();
        break;
      default:
    }
  }

  showAnnotation() {
    const tabContent = document.createElement('div');
    const textarea = document.createElement('textarea');

    tabContent.className = 'tab-content';
    textarea.style.width = '100%';
    textarea.style.height = '100%';
    tabContent.appendChild(textarea);
    this.contentDiv.appendChild(tabContent);
  }

  showViewer() {
    const tabContent = document.createElement('div');
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';

    iframe.src = 'https://s3-us-west-2.amazonaws.com/openai-assets/research-covers/language-unsupervised/language_understanding_paper.pdf';

    tabContent.className = 'tab-content';
    tabContent.appendChild(iframe);
    this.contentDiv.appendChild(tabContent);
  }
}
