import { createConnection } from "node:net";
import type { State } from "./player";

export default function (path: `\0${string}`) {
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

  return (state: State) => { conn.write(JSON.stringify(state, null, 0)) };
};