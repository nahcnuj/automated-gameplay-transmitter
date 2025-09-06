#!/usr/bin/env bun

import { fetch } from "bun";

await fetch('http://85.131.251.123:7777/', { method: 'POST' });

const ws = new WebSocket("ws://localhost:11180/sub?p=comments");
console.log('a');
ws.addEventListener("message", async (event) => {
  const { type, data } = JSON.parse(event.data);
  // console.log(JSON.stringify(data,null,2));
  switch (type) {
    case 'connected':
      // console.log(data.comments);
      // await fetch('http://85.131.251.123:7777/', { method: 'PUT', body: JSON.stringify(data.comments), headers: { "Content-Type": "application/json" } });
      // break;
      // fallthrough
    case 'comments':
      console.log(data.comments);
      await fetch('http://85.131.251.123:7777/', { method: 'PUT', body: JSON.stringify(data.comments), headers: { "Content-Type": "application/json" } });
      break;
    default:
      console.error("unknown data type: ", type);
      console.dir(data);
      break;
  }
});

// console.debug(JSON.stringify(ws, null, 2));