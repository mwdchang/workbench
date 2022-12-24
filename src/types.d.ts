export type Point = {
  x: number,
  y: number
}

// Short hand for generic selection
export type D3Selection<T> = d3.Selection<d3.BaseType, T, HTMLElement, any>;


// export type Base<T> = {
//   [P in keyof T]: T[P]
// }
// 
// export type Item<T> = {
//   _bench: {
//     id: string | number
//   }
// } & Base<T>


export type WorkBenchOptions = {
  width: number
  height: number
  useGrid: boolean
}


export type Item<T> = {
  id: string | number
  body: Matter.Body
  rawData: T

  // interaction
  selected: boolean

  // empheral calcs
  dx?: number
  dy?: number
}
