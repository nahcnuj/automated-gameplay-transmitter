import { createServer } from "node:net";
import type { Receiver } from "..";
import type { Action, State } from "./player";

export default function (path: `\0${string}`): Receiver<State, Action> {
  return (solve) => {
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
        // console.debug('[DEBUG]', 'statistics', JSON.stringify(state.statistics, null, 0));
        const action = solve(state);
        // console.debug('[DEBUG]', 'receiver', JSON.stringify(action, null, 0));
        conn.write(JSON.stringify(action, null, 0));
      });
    });
    server.listen(path);
    console.debug('[DEBUG]', 'listen', path.substring(1));
  };
};