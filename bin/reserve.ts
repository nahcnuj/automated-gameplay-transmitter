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
    const btn = page.getByRole('button', { name: '閉じる' });
    await btn.waitFor({ state: 'visible', timeout: 1_000 })
      .then(async () => {
        await btn.click({ timeout: 100 }).catch((err) => {
          console.log('could not the close button', err);
        });
      })
      .catch((err) => {
        console.log('A close button did not appear or failed to click.', err);
      });
  }

  {
    const detailButton = page.getByRole('button', { name: '詳細設定を開く' });
    console.debug(`500`);
    await detailButton.waitFor({ state: 'visible', timeout: 600_000 });
    console.debug(`510`);
    await detailButton.click();
    console.debug(`599`);
  }

  {
    const titleInput = page.getByLabel('番組タイトル', { exact: true });
    console.debug(`600`);
    await titleInput.fill('【人工知能実況】Cookie Clicker【AIVTuber】');
    console.debug(`601`);
  }

  {
    const reserveCheckbox = page.getByRole('button'/*'checkbox'*/, { name: '予約放送を利用する' });
    console.debug(`620`);
    await reserveCheckbox.check();
    console.debug(`621`);

    const reserveDate = page.getByPlaceholder(/20\d\d\/1?\d\/1?\d\([月火水木金土日]\)/);
    console.debug(`625 ${reserveDate}`);
    const selected = await reserveDate.selectOption({ index: 3 });
    console.debug(`626 ${selected}`);
  }

  {
    const btn = page.locator('button', { hasText: '番組を作成する' });
    console.debug(`800`);

    await btn.waitFor({ state: 'detached', timeout: 600_000 });
    console.debug(`899`);
  }

  await ctx.close();
  console.debug(`999`);

  // await browser.close();
})();