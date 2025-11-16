import createServer from "./receiver";
import createClient from "./sender";

const sock = '\0work.nahcnuj.automated-gameplay-transmitter.cookieclicker.sock';

export const createReceiver = createServer(sock);
export const createSender = createClient(sock);

export { dictOf } from "./i18n";

export type { Statistics } from "./player";