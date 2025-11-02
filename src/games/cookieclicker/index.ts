import createServer from "./receiver";
import createClient from "./sender";

const sock = `\0${__filename}` as const;

export const createReceiver = () => createServer(sock);
export const createSender = () => createClient(sock);