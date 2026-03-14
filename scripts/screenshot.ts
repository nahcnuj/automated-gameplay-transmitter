#!/usr/bin/env bun
/**
 * Takes a screenshot of the layout example and saves it to docs/layout.png.
 *
 * Usage: bun run scripts/screenshot.ts
 */

import { serve } from "bun";
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import exampleHtml from "../examples/layout/index.html";

const port = 7779;

const server = serve({
  port,
  routes: {
    "/*": exampleHtml,
  },
});

await mkdir("docs", { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 720 });
await page.goto(`http://localhost:${port}`);
await page.waitForLoadState("networkidle");
await page.screenshot({ path: "docs/layout.png" });
await browser.close();

server.stop();

console.log("Screenshot saved to docs/layout.png");
