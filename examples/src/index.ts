import { Workbench } from '../../src/workbench';
import { Toolbar } from '../../src/toolbar';

////////////////////////////////////////////////////////////////////////////////
// Example
////////////////////////////////////////////////////////////////////////////////
const containerElem = document.createElement('div');
containerElem.style.width = '1000px'
containerElem.style.height = '400px'
containerElem.style.border = '1px solid #DDD'

document.body.appendChild(containerElem);

const items = [
  {
    title: 'Information Visualization',
    author: 'Colin Ware'
  },
  {
    title: 'Brave NUI World',
    author: 'Daniel Wigdor'
  },
  {
    title: 'Let my People go Surfing',
    author: 'Yvon Chouinard'
  },
  {
    title: 'Causal Inference in Statistics',
    author: 'Judea Pearl'
  },
  {
    title: 'Word2Vec',
    author: 'Chris McCormick',
    url: 'http://mccormickml.com/2016/04/19/word2vec-tutorial-the-skip-gram-model/'
  },
  {
    title: 'GTP',
    author: 'Muhan Zhang, Yixin Chen',
    url: 'https://arxiv.org/pdf/1802.09691.pdf'
  }
];

const bench = new Workbench(containerElem, {
  width: 1000,
  height: 400,
  useGrid: true,
  useRotation: true,

  itemDisplayTextFn: (item) => {
    return item.rawData.title
  }
});

const toolbar = new Toolbar({ x: 5, y: 410, width: 950 });
toolbar.setWorkbench(bench);

bench.setItems(items);
bench.run();
toolbar.attach();
