import { createServer } from "node:net";
import type { Action, State } from "./player";

export default function (path: `\0${string}`) {
  return (onData: (s: State) => Action) => {
    const server = createServer((conn) => {
      conn.on('connect', () => {
        console.debug('[DEBUG]', 'socket connected');
      });
      conn.on('close', () => {
        console.debug('[DEBUG]', 'socket closed');
      });
      conn.on('end', () => {
        console.debug('[DEBUG]', 'socket closed, reconnecting...');
        conn.connect({ path });
      });
      conn.on('error', (err) => {
        console.error('[ERROR]', err);
      });

      conn.on('data', (buf) => {
        const state: State = JSON.parse(buf.toString());
        console.debug('[DEBUG]', 'receiver', 'switches:', JSON.stringify(state.store.switches, null, 0));
        const action = onData(state);
        // console.debug('[DEBUG]', 'receiver', JSON.stringify(action, null, 0));
        conn.write(JSON.stringify(action, null, 0));
      });
    });
    server.listen(path);
    console.debug('[DEBUG]', 'listen', path.substring(1));
  }
};