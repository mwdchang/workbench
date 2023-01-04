export type Point = {
  x: number,
  y: number
}

export type PopupOptions = {
  x: number
  y: number
  width?: number
  height?: number
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
  useRotation: boolean

  itemDisplayTextFn: (i: Item<any>) => string
}

export type Collection<T> = {
  id: string
  body: Matter.Body
  children: T[]

  flags: {
    matched: boolean
  },

  // empheral calcs
  dx?: number
  dy?: number
}

export type Item<T> = {
  id: string | number
  body: Matter.Body
  rawData: T

  // interactios
  flags: {
    selected: boolean
    matched: boolean
  }

  // empheral calcs
  dx?: number
  dy?: number
}
