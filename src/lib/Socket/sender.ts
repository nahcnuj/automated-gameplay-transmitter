'use server';

import { createConnection } from "node:net";
import type { GameIPC } from "../GameIPC";

export const createSender = <S, T>(path: string): GameIPC<S, T>['sender'] => (run) => {
    let running = false;

    const conn = createConnection(path);
    conn.on('connect', () => {
      console.log('[INFO]', 'socket connected', path.replace('\0', ''));
    });
    conn.on('end', () => {
      console.log('[INFO]', 'socket closed', path.replace('\0', ''));
    });
    conn.on('error', (err) => {
      console.error('[ERROR]', 'socket error', path.replace('\0', ''), JSON.stringify(err, null, 2));
    });

    conn.on('data', async (buf) => {
      if (running) return;

      const action = JSON.parse(buf.toString());
      if (!action) return;

      running = true;
      try {
        await run(action);
      } catch (err) {
        console.warn('[WARN]', 'error occured during the action', JSON.stringify(action, null, 2), JSON.stringify(err, null, 2));
      } finally {
        running = false;
      }
    });
    return (s) => {
      conn.write(JSON.stringify(s, null, 0));
    };
  };
