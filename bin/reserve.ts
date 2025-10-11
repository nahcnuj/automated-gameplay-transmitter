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
      default: './playwright/.auth/',
    },
    'exec-path': {
      type: 'string',
      default: '/usr/bin/chromium',
    },
  },
});

if (!statSync(userDataDir).isDirectory()) {
  throw new Error('--user-data-dir must be a directory path');
}

console.debug(`0`);

const ctx = await chromium.launchPersistentContext(userDataDir, {
  executablePath,
  headless: false,
});
console.debug('200');

const page = await ctx.newPage();
console.debug(`300`);

const firstDate = new Date('2025-08-03T10:48:00+09:00');
const day = new Date().getDay();

let cont = true;

do {
  const next = await (async () => {
    await page.goto('https://garage.nicovideo.jp/niconico-garage/live/history');
    const frame = page.frameLocator('iframe[src]');
    const child = frame.getByText('終了').first();
    await child.waitFor({ state: 'attached' });
    const datetime = await child.getAttribute('datetime');
    if (!datetime) {
      throw new Error('datetime is null');
    }
    return new Date(datetime);
  })();
  console.debug(next.toLocaleString('ja-JP'));

  await page.goto('https://live.nicovideo.jp/create');
  console.debug(`400`);

  try {
    const btn = page.getByRole('button', { name: '閉じる' });
    await btn.waitFor({ state: 'visible', timeout: 1_000 });
    await btn.click({ timeout: 100 });
  } catch (_) {
    // ignore
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
    const day = Math.ceil((next.getTime() - firstDate.getTime()) / 1000 / 60 / 60 / 24);
    await titleInput.fill(`【人工無能実況】Cookie Clicker ${day}日目【AIVTuber】`);
    console.debug(`601`);
  }

  {
    const reserveCheckbox = page.getByRole('button', { name: '予約放送を利用する' });
    console.debug(`620`);
    await reserveCheckbox.click();
    console.debug(`621`);

    {
      const selects = page.getByText('放送開始日時').locator('xpath=../..').locator('select');

      {
        const reserveDate = selects.nth(0);
        await reserveDate.click();
        console.debug(`625`);
        const value = new Intl.DateTimeFormat('ja-JP', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        }).format(next);
        console.debug(`    ${value}`)
        const selected = await reserveDate.selectOption({ value });
        console.debug(`626 ${selected}`);
      }

      {
        const reserveHours = selects.nth(1);
        await reserveHours.click();
        const selected = await reserveHours.selectOption({ label: next.getHours().toString() });
        console.debug(`627 ${selected}`);
      }

      {
        const reserveMinutes = selects.nth(2);
        await reserveMinutes.click();
        const selected = await reserveMinutes.selectOption({ value: next.getMinutes().toString() });
        console.debug(`628 ${selected}`);
      }
    }

    {
      const selects = page.getByText('放送時間').locator('xpath=../..').locator('select');

      {
        const durationHours = selects.nth(0);
        await durationHours.click();
        const label = await durationHours.locator(':not([disabled])').allTextContents().then((vs) => vs.at(-1));
        const selected = await durationHours.selectOption({ label });
        console.debug(`629 ${selected}`);
      }

      {
        const durationMinutes = selects.nth(1);
        await durationMinutes.click();
        const selected = await durationMinutes.selectOption({ value: '0' });
        console.debug(`630 ${selected}`);
      }
    }
  }

  {
    const btn = page.getByRole('button', { name: '予約する' });
    console.debug(`800`);
    await btn.focus();

    await btn.waitFor({ state: 'detached', timeout: 600_000 });
    console.debug(`899`);
  }

  cont = next.getDay() !== day;
} while (cont);

await ctx.close();
console.debug(`999`);