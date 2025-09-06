#!/usr/bin/env bun

import { fetch } from "bun";

setInterval(async () => {
  await fetch('http://85.131.251.123:7777/', { method: 'POST' });
  await fetch('http://localhost:7777/', { method: 'POST' }).catch(() => {});
}, 1000);

const ws = new WebSocket("ws://localhost:11180/sub?p=comments");
ws.addEventListener("message", async (event) => {
  const { type, data } = JSON.parse(event.data);
  // console.log(JSON.stringify(data,null,2));
  switch (type) {
    case 'connected':
    case 'comments':
      // console.log(data.comments);
      await fetch('http://85.131.251.123:7777/', { method: 'PUT', body: JSON.stringify(data.comments), headers: { "Content-Type": "application/json" } });
      await fetch('http://localhost:7777/', { method: 'PUT', body: JSON.stringify(data.comments), headers: { "Content-Type": "application/json" } }).catch(() => {});
      break;
    default:
      console.error("unknown data type: ", type);
      console.dir(data);
      break;
  }
});

// console.debug(JSON.stringify(ws, null, 2));