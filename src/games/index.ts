export type Receiver<S, A> = (solver: (state: S) => A) => void;

export type Sender<S, A> = (runner: (action: A) => Promise<void>) => (state: S) => void