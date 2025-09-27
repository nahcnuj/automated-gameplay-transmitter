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
console.debug(userDataDir);

(async () => {
  console.debug('100');
  const browser = await chromium.launch({
    executablePath,
    headless: false,
  });
  console.debug(`150`);
  // const ctx = await browser.newContext();
  const ctx = await chromium.launchPersistentContext(userDataDir, { headless: false });
  console.debug(`200`);
  const page = await ctx.newPage();
  console.debug(`300`);
  await page.goto('https://live.nicovideo.jp/create');
  console.debug(`400`);
  await page.getByText('詳細設定を開く').click();
  console.debug(`500`);
  await ctx.close();
  await browser.close();
})();