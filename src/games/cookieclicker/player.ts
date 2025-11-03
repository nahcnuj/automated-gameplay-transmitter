type Product = {
  name: string
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