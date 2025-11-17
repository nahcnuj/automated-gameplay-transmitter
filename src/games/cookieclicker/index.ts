import Receiver from "./receiver";
import Client from "./sender";

const sock = '\0work.nahcnuj.automated-gameplay-transmitter.cookieclicker.sock';
export const createReceiver = Receiver(sock);
export const createSender = Client(sock);

export { dictOf } from "./i18n";

export type { Statistics } from "./player";
