export interface GameIPC<State, Action> {
  receiver: (solve: (state: State) => Action) => void
  sender: (run: (action: Action) => Promise<void>) => (state: State) => void
}