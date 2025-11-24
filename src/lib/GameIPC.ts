export interface GameIPC<State, Action> {
  receiver: (solve: (state: State) => Action) => void
  sender: (run: (action: Action) => Promise<void>) => Promise<(state: State) => void>
}
