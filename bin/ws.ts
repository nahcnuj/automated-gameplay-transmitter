#!/usr/bin/env bun

import { fetch } from 'bun';
import { parseArgs } from 'node:util';

const { positionals: [ target = 'localhost:7777' ] } = parseArgs({
  args: Bun.argv.slice(2),
  strict: true,
  allowPositionals: true,
})

await fetch(`http://${target}/`, { method: 'DELETE' });

setInterval(async () => {
  await fetch(`http://${target}/`, { method: 'POST' }).catch((err) => {
    console.warn(err);
  });
}, 1000);

const ws = new WebSocket('ws://localhost:11180/sub?p=comments,meta');
ws.addEventListener('message', async (event) => {
  const { type, data } = JSON.parse(event.data);
  switch (type) {
    case 'connected':
    case 'comments':
      console.log(data.comments);
      await fetch(`http://${target}/`, {
        method: 'PUT',
        body: JSON.stringify(data.comments),
        headers: { 'Content-Type': 'application/json' },
      }).catch((err) => {
        console.warn(err);
      });
      break;
    case 'meta':
      console.log(data.data);
      await fetch(`http://${target}/api/meta`, {
        method: 'POST',
        body: JSON.stringify(data.data),
        headers: { 'Content-Type': 'application/json' },
      }).catch((err) => {
        console.warn(err);
      });
      break;
    default:
      console.error('unknown data type: ', type);
      console.dir(data);
      break;
  }
});