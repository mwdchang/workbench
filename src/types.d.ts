export type Point = {
  x: number,
  y: number
}

// Short hand for generic selection
export type D3Selection<T> = d3.Selection<d3.BaseType, T, HTMLElement, any>;

