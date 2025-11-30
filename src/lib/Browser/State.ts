import type { Action } from "./Action";

export type State =
  | {
    name: 'initialized'
  }
  | {
    name: 'closed'
  }
  | {
    name: 'idle'
    url: string
    state?: unknown
  }
  | {
    name: 'result'
    succeeded: boolean
    action: Action
  }
