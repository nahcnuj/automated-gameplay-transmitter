type Product = {
  name: string
  mult: number
  price: number
  enabled: boolean
};

type Upgrade = {
  name?: string
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
  } & {
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
  }
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
    upgrades: Upgrade[]
    switches: Switch[]
  }
  statistics?: Statistics
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