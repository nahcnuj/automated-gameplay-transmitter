#!/usr/bin/env bun

import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { chromium } from "playwright";

const { values: {
  file,
  browser: executablePath,
} } = parseArgs({
  options: {
    file: {
      short: 'f',
      type: 'string',
      default: './var/cookieclicker.txt',
    },
    browser: {
      type: 'string',
      default: '/usr/bin/chromium',
    },
  },
});

const browser = await chromium.launch({
  executablePath,
  headless: false,
  args: [
    '--window-size=960,576',
    '--window-position=1280,300',
  ],
  slowMo: 100,
});

const ctx = await browser.newContext();
if (!ctx) {
  await browser.close();
  throw new Error('could not create a context');
}

const page = await ctx.newPage();
if (!page) {
  await ctx.close();
  await browser.close();
  throw new Error('could not create a page');
}

await page.goto('https://orteil.dashnet.org/cookieclicker/');

try {
  await page.getByText('Got it').click();
  console.debug(`Got it!`);
} catch {
  // do nothing
}

try {
  await page.getByText('日本語').click();
  console.debug(`日本語`);
} catch {
  // do nothing
}

try {
  const btn = page.getByText('次回から表示しない');
  await btn.waitFor({ state: 'visible', timeout: 10_000 });
  await btn.click();
  console.debug(`Do not show again`);
} catch {
  // do nothing
}

{
  console.debug(`Configurating...`);

  const options = page.locator('.subButton', { hasText: 'オプション' });
  await options.click();
  console.debug(`Clicked the option button.`);

  const menu = page.locator('#menu');

  await menu.locator('#volumeSlider').fill('100');
  console.debug(`Made the volume maximum.`);

  try {
    await menu.getByText(/高品質.*ON/i).click();
    console.debug(`Turned off high quality.`);
  } catch {
    // do nothing
  }

  try {
    await menu.getByText(/CSS.*ON/i).click();
    console.debug(`Turned off CSS filters.`);
  } catch {
    // do nothing
  }

  try {
    await menu.getByText(/パーティクル.*ON/i).click();
    console.debug(`Turned off particles.`);
  } catch {
    // do nothing
  }

  await menu.locator('.close').click();
  console.debug(`Closed the menu.`);
}

let data: string | undefined;
try {
  data = readFileSync(file, 'utf8');
} catch (err) {
  console.warn(err);
}

if (data) {
  console.debug(`Importing...`);

  const options = page.locator('.subButton', { hasText: 'オプション' });
  await options.click();
  console.debug(`Clicked the option button.`);

  const menu = page.locator('#menu');

  await menu.press('Control+O');
  console.debug(`Pressed Ctrl+O.`);

  const popup = page.locator('#prompt');

  await popup.getByRole('textbox').fill(data);
  await popup.getByText('ロード').click();

  await popup.waitFor({ state: 'hidden' });
  console.debug(`Imported!`);

  await menu.locator('.close').click();
  console.debug(`Closed the menu.`);
}

const say = async (text: string) => {
  try {
    console.debug(`${new Date().toLocaleString()}: ${text}`);
    await fetch('http://localhost:7777/api/talk', {
      method: 'POST',
      body: text,
    });
  } catch (err) {
    console.warn(err);
  }
};

const clicker = setInterval(async () => {
  const bigCookie = page.locator('#bigCookie');
  try {
    await bigCookie.click({ timeout: 100 });
  } catch {
    // do nothing
  }
}, 250);

const shopper = setInterval(async () => {
  const shop = page.locator('#store');

  const upgradable = shop.locator('#upgrades').locator('.enabled');
  if (await upgradable.count() > 0) {
    const mostExpensive = upgradable.last();
    await mostExpensive.hover();
    const tooltip = page.locator('#tooltipAnchor');
    const name = await tooltip.locator('.name').innerText();
    await say(`アップグレード ${name}を 買います`);
    const description = await tooltip.locator('.description').innerText();
    await say(description);
    await mostExpensive.click();
  }

  const purchasable = shop.locator('#products').locator('.enabled');
  if (await purchasable.count() > 0) {
    const mostExpensive = purchasable.last();
    const name = await mostExpensive.locator('.productName').textContent();
    await say(`${name}を 買います`);
    await mostExpensive.click();
  }
}, 1_000);

const notifier = setInterval(async () => {
  const notes = page.locator('#notes');

  for (const l of await notes.locator('.note', { hasText: '実績が解除' }).all()) {
    const title = await l.getByRole('heading', { level: 5 }).textContent();
    await say(`${title}の 実績が解除されました！`);
    await l.locator('.close').click();
  }
}, 1_000);

const exporter = setInterval(async () => {
  console.debug(`Exporting...`);
  try {
    const options = page.locator('.subButton', { hasText: 'オプション' });
    await options.click();
    console.debug(`Clicked the option button.`);

    const menu = page.locator('#menu');
    await menu.getByText('エクスポート').click();
    console.debug(`Clicked the exporting button`);

    const popup = page.locator('#prompt');
    console.debug(`Popped up the exporting menu.`);

    data = await popup.getByRole('textbox').inputValue();
    writeFileSync(file, data, 'utf8');

    await popup.getByText('完了').click();
    await popup.waitFor({ state: 'hidden' });
    console.debug(`Exported!`);

    await menu.locator('.close').click();
    console.debug(`Closed the menu.`);
  } catch (err) {
    console.warn('Failed to save.', err);
  }
}, 600_000);

setTimeout(async () => {
  clearInterval(clicker);
  clearInterval(shopper);
  clearInterval(notifier);
  clearInterval(exporter);
  await ctx.close();
  await browser.close();
}, 6_000_000);