import { createConnection } from "node:net";
import type { Action, State } from "./player";

export default function (path: `\0${string}`) {
  return (f: (action: Action) => Promise<void>) => {
    console.debug('[DEBUG]', 'create socket connection', path.substring(1));
    let conn = createConnection(path);

    conn.on('connect', () => {
      console.debug('[DEBUG]', 'socket connected');
    });
    conn.on('end', () => {
      console.debug('[DEBUG]', 'socket closed, reconnecting...');
      conn.connect({ path });
    });
    conn.on('error', (err) => {
      console.error('[ERROR]', err);
    });

    conn.on('data', async (buf) => {
      const action: Action = JSON.parse(buf.toString());
      console.debug('[DEBUG]', JSON.stringify(action, null, 0));
      await f(action);
    });

    return (state: State) => { conn.write(JSON.stringify(state, null, 0)) };
  };
};