#!/usr/bin/env bun

import { statSync } from "node:fs";
import { parseArgs } from "node:util";
import { chromium } from "playwright";

const { values: {
  'user-data-dir': userDataDir,
  'exec-path': executablePath,
  auto,
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
    auto: {
      short: 'a',
      type: 'boolean',
      default: false,
    },
  },
});

if (!statSync(userDataDir).isDirectory()) {
  throw new Error('--user-data-dir must be a directory path');
}

const ctx = await chromium.launchPersistentContext(userDataDir, {
  executablePath,
  headless: false,
});

const page = ctx.pages()[0] ?? await ctx.newPage();

const firstDate = new Date('2025-08-03T10:48:00+09:00');
const day = new Date().getDay();

let cont = true;

do {
  console.debug(`Getting the date of the latest live...`);
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

  await page.goto('https://live.nicovideo.jp/create', { waitUntil: 'domcontentloaded' });
  console.debug(`Creating a reservation...`);

  try {
    const btn = page.getByRole('button', { name: '閉じる' });
    await btn.waitFor({ state: 'visible', timeout: 1_000 });
    await btn.click({ timeout: 100 });
  } catch {
    // do nothing
  }

  {
    const detailButton = page.getByRole('button', { name: '詳細設定を開く' });
    await detailButton.click();
    await detailButton.waitFor({ state: 'hidden' });
    console.debug(`Opened the detail configuration.`);
  }

  {
    const titleInput = page.getByLabel('番組タイトル', { exact: true });
    const day = Math.ceil((next.getTime() - firstDate.getTime()) / 1000 / 60 / 60 / 24);
    const title = `無秩序なクッキークリッカー実況 ${day}日目`;
    await titleInput.fill(title);
    console.debug(`Filled title: "${title}"`);
  }

  {
    await page.getByRole('button', { name: '予約放送を利用する' }).click();
    console.debug(`Reservating...`);

    {
      console.debug(`Selecting date...`)
      const selects = page.getByText('放送開始日時').locator('xpath=../..').locator('select');

      {
        const date = new Intl.DateTimeFormat('ja-JP', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        }).format(next);
        console.debug(`Next date: ${date}`);

        const reserveDate = selects.nth(0);
        await reserveDate.click();
        const selected = await reserveDate.selectOption({ value: date });
        console.debug(`Selected date: ${selected}`);
      }

      {
        const reserveHours = selects.nth(1);
        await reserveHours.click();
        const selected = await reserveHours.selectOption({ label: next.getHours().toString() });
        console.debug(`Selected hours: ${selected}`);
      }

      {
        const reserveMinutes = selects.nth(2);
        await reserveMinutes.click();
        const selected = await reserveMinutes.selectOption({ value: next.getMinutes().toString() });
        console.debug(`Selected minutes: ${selected}`);
      }
    }

    {
      console.debug(`Selecting duration...`);

      const selects = page.getByText('放送時間').locator('xpath=../..').locator('select');

      const [durationHours, durationMinutes] = await selects.all();
      if (!durationHours || !durationMinutes) {
        throw new Error('failed to select duration');
      }

      {
        const hours = await durationHours.locator(':not([disabled])').last().textContent();
        if (!hours) {
          throw new Error('failed to select duration hours');
        }

        await durationHours.click();
        const selected = await durationHours.selectOption({ label: hours });
        console.debug(`Selected duration hours: ${selected}`);
      }

      {
        await durationMinutes.click();
        const selected = await durationMinutes.selectOption({ value: '0' });
        console.debug(`Selected duration minutes: ${selected}`);
      }
    }
  }

  {
    const selected = await page.getByLabel('強度', { exact: true }).selectOption({ label: '強' });
    console.debug(`Selected comment filtering strength: ${selected}`);
  }

  {
    const submit = page.getByRole('button', { name: '予約する' });
    if (auto) {
      await submit.click();
    } else {
      await submit.focus();
      console.debug(`Waiting for submitting by human...`);
    }
    await submit.waitFor({ state: 'detached', timeout: 600_000 });
    console.debug(`Reserved!`);
  }

  // until the same day of the next week
  cont = next.getDay() !== day;
} while (cont);

await ctx.close();