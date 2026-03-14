#!/usr/bin/env bun
/**
 * Takes a screenshot of the layout example and saves it to examples/layout.png.
 *
 * Usage: bun run examples/screenshot.ts
 */

import { serve } from "bun";
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import exampleHtml from "./index.html";

const port = 7779;

const server = serve({
  port,
  routes: {
    "/*": exampleHtml,
  },
});

await mkdir(new URL(".", import.meta.url).pathname, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 720 });
await page.goto(`http://localhost:${port}`);
await page.waitForLoadState("networkidle");
await page.screenshot({ path: new URL("layout.png", import.meta.url).pathname });
await browser.close();

server.stop();

console.log("Screenshot saved to examples/layout.png");
