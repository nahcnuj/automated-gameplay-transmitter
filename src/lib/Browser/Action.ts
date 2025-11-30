export type Action =
  | {
    name: 'noop'
  }
  | {
    name: 'open'
    url: string
  }
  | {
    name: 'click'
    target:
    | {
      type: 'text'
      text: string
    }
    | {
      type: 'id'
      id: string
    }
  }
  | {
    name: 'press'
    key: string
    on?: {
      selector: string
    }
  }
  | {
    name: 'fill'
    value: string
    on: {
      selector: string
      role: string
    }
  }

export const noop: Action = {
  name: 'noop',
};

export const open = (url: string): Action => ({
  name: 'open',
  url,
});

export const clickByText = (text: string): Action => ({
  name: 'click',
  target: {
    type: 'text',
    text,
  },
});

export const clickByElementId = (id: string): Action => ({
  name: 'click',
  target: {
    type: 'id',
    id,
  },
});
