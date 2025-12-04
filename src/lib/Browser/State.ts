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
    selectedText?: string
    state?: unknown
  }
  | {
    name: 'result'
    succeeded: boolean
    action: Action
  }
