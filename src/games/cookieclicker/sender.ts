import { createConnection } from "node:net";
import type { Sender } from "..";
import type { Action, State } from "./player";

export default function (path: `\0${string}`): Sender<State, Action> {
  return (run) => {
    console.debug('[DEBUG]', 'create socket connection', path.substring(1));
    let conn = createConnection(path);

    conn.on('connect', () => {
      console.debug('[DEBUG]', 'socket connected');
    });
    conn.on('end', () => {
      console.debug('[DEBUG]', 'socket closed');
    });
    conn.on('error', (err) => {
      console.error('[ERROR]', err);
    });

    conn.on('data', async (buf) => {
      const action = JSON.parse(buf.toString());
      if (action) {
        await run(action);
      }
    });

    return (state: State) => {
      conn.write(JSON.stringify(state, null, 0));
    };
  };
};