'use server';

import { createServer } from "node:net";
import type { GameIPC } from "../GameIPC";

export const createReceiver = <S, T>(path: string): GameIPC<S, T>['receiver'] => (solve) => {
  const server = createServer((conn) => {
    conn.on('connect', () => {
      console.log('[INFO]', 'socket connected', path.replace('\0', ''));
    });
    conn.on('end', () => {
      console.log('[INFO]', 'socket closed', path.replace('\0', ''));
    });
    conn.on('error', (err) => {
      console.error('[ERROR]', 'socket error', path.replace('\0', ''), JSON.stringify(err, null, 2));
    });

    conn.on('data', (buf) => {
      const state: S = JSON.parse(buf.toString());
      const action = solve(state);
      conn.write(JSON.stringify(action, null, 0));
    });
  });
  server.listen(path);
  console.log('[INFO]', 'listen', path.replace('\0', ''));
};
