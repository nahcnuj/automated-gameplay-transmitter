type Product = {
  name: string
  mult: number
  price: number
  enabled: boolean
};

type Upgrade = {
  name?: string
  enabled: boolean
}

type Switch = {
  description?: string
  enabled: boolean
}

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
    upgrades: Upgrade[]
    switches: Switch[]
  }
};

export type Action =
  | {
    action: 'click'
  }
  | {
    action: 'buyProduct'
    name: string
  }
  | {
    action: 'buyUpgrade'
    name: string
  }
  | {
    action: 'toggleSwitch'
    name: string
  };