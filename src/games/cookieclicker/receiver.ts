import { createServer } from "node:net";
import type { State } from "./player";

export default function (sock: `\0${string}`) {
  return (onData: (s: State) => void) => {
    const server = createServer((conn) => {
      conn.on('connect', () => {
        console.debug('[DEBUG]', 'socket connected');
      });
      conn.on('close', () => {
        console.debug('[DEBUG]', 'socket closed');
      });
      conn.on('data', (buf) => {
        const state = JSON.parse(buf.toString());
        // console.debug('[DEBUG]', JSON.stringify(state, null, 0));
        onData(state);
      });
      conn.on('error', (err) => {
        console.error('[ERROR]', err);
      });
    });
    server.listen(sock);
    console.debug('[DEBUG]', 'listen', sock.substring(1));
  }
};