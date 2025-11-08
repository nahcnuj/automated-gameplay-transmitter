type Product = {
  name: string
  mult: number
  price: number
  enabled: boolean
};

export type State = {
  ticks: number
  cookies: number
  cps: number
  isWrinkled: boolean
  commentsText: string
  store: {
    products: {
      bulkMode: 'buy' | 'sell'
      items: Product[]
    }
  }
};

export type Action = {
  action: 'click'
} | {
  action: 'buyProduct',
  name: string,
};