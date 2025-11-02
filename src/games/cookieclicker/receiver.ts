import { createServer } from "node:net";

const server = createServer((conn) => {
  console.debug('[DEBUG]', 'socket connected');

  conn.on('close', () => {
    console.debug('[DEBUG]', 'socket closed');
  });
  conn.on('data', (data) => {
    console.debug('[DEBUG]', data.toString());
  });
  conn.on('error', (err) => {
    console.error('[ERROR]', err);
  });
});

export default function (sock: `\0${string}`) {
  server.listen(sock);
  console.debug('[DEBUG]', 'listen', sock.substring(1));
};