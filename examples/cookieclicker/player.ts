type Product = {
  name: string
  mult: number
  price: number
  enabled: boolean
};

type Upgrade = {
  enabled: boolean
};

type Tech = {
  enabled: boolean
};

type Switch = {
  description?: string
  enabled: boolean
};

export type Statistics = {
  general: {
    [key in string]: {
      innerText: string
    }
  } & Partial<{
    cookiesInBank: {
      value: number
    }
    cookiesBakedInThisAscension: {
      value: number
    }
    cookiesBakedInTotal: {
      value: number
    }
    cookiesForfeitedByAscending: {
      value: number
    }
    legacyStarted: {
      ascensions: number
    }
    buildingsOwned: {
      value: number
    }
    cookiesPerClick: {
      value: number
    }
    cookieClicks: {
      value: number
    }
    handmadeCookies: {
      value: number
    }
  }>
};

export type State = {
  modal?: undefined

  ticks?: number
  cookies: number
  cps: number
  isWrinkled: boolean
  ascendNumber: number
  commentsText?: string
  store: {
    products: {
      bulkMode: 'buy' | 'sell'
      items: Product[]
    }
    upgrades: Upgrade[]
    tech: Tech[]
    switches: Switch[]
  }
  statistics?: Statistics
} | {
  modal: 'ascending'
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
    name?: string
  }
  | {
    action: 'research'
  }
  | {
    action: 'toggleSwitch'
    name: string
  }
  | {
    action: 'ascend'
  }
  | {
    action: 'reincarnate'
  }
  | {
    action: undefined
  }
