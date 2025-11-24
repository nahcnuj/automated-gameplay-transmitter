import { createReceiver as receiver, createSender as sender } from "../../lib/Socket";
import type { Action, State } from "./player";

export type { Statistics } from "./player";

const path = '\0work.nahcnuj.automated-gameplay-transmitter.cookieclicker.sock';

export const createReceiver = receiver<State, Action>(path);
export const createSender = sender<State, Action>(path);

export { dictOf } from "./i18n";

export { sight } from "./sight";
