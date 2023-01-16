import { Workbench } from '../../src/workbench';
import { Toolbar } from '../../src/toolbar';
import { xddItems } from '../../src';

////////////////////////////////////////////////////////////////////////////////
// Example
////////////////////////////////////////////////////////////////////////////////
const containerElem = document.createElement('div');
containerElem.style.width = '1200px'
containerElem.style.height = '400px'
containerElem.style.border = '1px solid #DDD'

document.body.appendChild(containerElem);

const searchFn = (item: any, str: string) => {
	const includes = (a, b) => a.toLowerCase().includes(b.toLowerCase());

	if (includes(item.rawData.title, str)) return true;
	if (includes(item.rawData.abstract, str)) return true;
	return false;
}


const bench = new Workbench(containerElem, {
  width: 1000,
  height: 400,
  useGrid: true,
  useRotation: true,

	itemSearchFn: searchFn,

  itemDisplayTextFn: (item, k) => {
    if (k > 2.8) {
      return item.rawData.title + '<hr>' + 
        `<a href="${item.rawData.link[0].url}" target="_blank"> ${item.rawData.link[0].url} </a><br>` + 
        item.rawData.abstract.substring(0, 70 * k);
    }
    return item.rawData.title.length < 25 ? item.rawData.title : item.rawData.title.substring(0, 25) + '...';
  }
});

const toolbar = new Toolbar({ x: 5, y: 410, width: 950 });
toolbar.setWorkbench(bench);

bench.setItems(xddItems);
bench.run();
toolbar.attach();
