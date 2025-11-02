import { createServer } from "node:net";
import type { Data } from "./player";

const server = createServer((conn) => {
  console.debug('[DEBUG]', 'socket connected');

  conn.on('close', () => {
    console.debug('[DEBUG]', 'socket closed');
  });
  conn.on('data', (buf) => {
    const data: Data = JSON.parse(buf.toString());
    console.debug('[DEBUG]', data);
  });
  conn.on('error', (err) => {
    console.error('[ERROR]', err);
  });
});

export default function (sock: `\0${string}`) {
  server.listen(sock);
  console.debug('[DEBUG]', 'listen', sock.substring(1));
};