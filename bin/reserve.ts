#!/usr/bin/env bun

import { statSync } from "node:fs";
import { parseArgs } from "node:util";
import { chromium } from "playwright";

const { values: {
  'user-data-dir': userDataDir,
  'exec-path': executablePath,
} } = parseArgs({
  options: {
    'user-data-dir': {
      type: 'string',
    },
    'exec-path': {
      type: 'string',
    },
  },
});

if (!userDataDir || !statSync(userDataDir).isDirectory()) {
  throw new Error('--user-data-dir must be a directory path');
}
// console.debug(userDataDir);

// const url = await fetch('http://localhost:9222/json/version').then((res) => res.json()).then(({ webSocketDebuggerUrl }) => webSocketDebuggerUrl);

(async () => {
  console.debug(`0`);

  const ctx = await chromium.launchPersistentContext(userDataDir, {
    executablePath,
    headless: false,
  });
  console.debug(`100`);

  // const ctx = await browser.newContext();
  if (!ctx) {
    throw new Error('could not get a context of the browser');
  }
  console.debug('200');

  const page = await ctx.newPage();
  console.debug(`300`);

  await page.goto('https://live.nicovideo.jp/create');
  console.debug(`400`);

  {
    const btn = page.locator('button', { hasText: '詳細設定を開く' });
    console.debug(`500`);

    await btn.waitFor({ state: 'visible', timeout: 600_000 });
    console.debug(`510`);

    await btn.click();
    console.debug(`599`);
  }

  {
    const btn = page.locator('button', { hasText: '番組を作成する' });
    console.debug(`600`);

    await btn.waitFor({ state: 'detached', timeout: 600_000 });
    console.debug(`699`);
  }

  await ctx.close();
  console.debug(`999`);

  // await browser.close();
})();