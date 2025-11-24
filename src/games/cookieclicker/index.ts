import { createSocketPair } from "../../lib/socket";
import type { Action, State } from "./player";

export type { Statistics } from "./player";

const sock = '\0work.nahcnuj.automated-gameplay-transmitter.cookieclicker.sock';

export const {
  receiver: createReceiver,
  sender: createSender,
} = createSocketPair<State, Action>(sock);

export { dictOf } from "./i18n";

export { sight } from "./sight";
