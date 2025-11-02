import { createConnection } from "node:net";

export default function (sock: `\0${string}`) {
  console.debug('[DEBUG]', 'create socket connection', sock.substring(1));
  const conn = createConnection(sock);

  conn.on('connect', () => {
    console.debug('[DEBUG]', 'socket connected');
  });
  conn.on('end', () => {
    console.debug('[DEBUG]', 'socket closed');
  });
  conn.on('error', (err) => {
    console.error('[ERROR]', err);
  });

  return (data: unknown) => { conn.write(JSON.stringify(data, null, 0)) };
};