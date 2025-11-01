#!/usr/bin/env bun

import { readFileSync, writeFileSync } from "node:fs";
import timersPromises from "node:timers/promises";
import { parseArgs } from "node:util";
import type { Locator, Page } from "playwright";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

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

const say = async (text: string) => {
  try {
    console.debug(`${new Date().toLocaleString()}: ${text}`);
    await fetch('http://localhost:7777/api/talk', {
      method: 'POST',
      body: text,
    });
    await page.waitForTimeout(50 * text.length);
  } catch (err) {
    console.warn(err);
  }
};

const CookieClicker = async (page: Page) => {
  await page.goto('https://orteil.dashnet.org/cookieclicker/', { timeout: 300_000 });

  await page.getByText('日本語').click({ timeout: 300_000 });
  await page.getByText('Got it').click({ timeout: 300_000 });
  await page.getByText('次回から表示しない').click({ timeout: 300_000 });

  const menu = page.locator('#menu');

  const withOptionMenu = async (callback: (menu: Locator) => Promise<void>) => {
    console.debug('[DEBUG]', new Date().toISOString(), 'withOptionMenu');

    if (!await menu.isVisible()) {
      const options = page.locator('.subButton', { hasText: 'オプション' });
      await options.click({ timeout: 60_000 });

      await menu.waitFor({ state: 'visible', timeout: 60_000 });
    }

    await callback(menu);

    await menu.locator('.close').click({ timeout: 60_000 });
    await menu.waitFor({ state: 'hidden', timeout: 60_000 });
  };

  const cookie = page.locator('#bigCookie');
  const tooltip = page.locator('#tooltipAnchor');
  const store = page.locator('#store');
  const prompt = page.locator('#prompt');

  await page.locator('#notes').evaluate(el => {
    const observer = new MutationObserver(async ([l]) => {
      if (l?.type !== 'childList') return;
      console.debug('[DEBUG]', '#notes', l);
      for (const el of l.addedNodes) {
        const title = (el as HTMLElement).querySelector('h5')?.textContent;
        if (title) {
          await say(title);
        }
        console.debug('[DEBUG]', el.textContent);
        const closeButtons = (el as HTMLElement).querySelector('.close');
        const rect = closeButtons?.getBoundingClientRect();
        if (rect) {
          console.debug('[DEBUG]', 'rect', rect);
          closeButtons?.dispatchEvent(new PointerEvent('click', {
            cancelable: true,
            bubbles: true,
            screenX: rect.x,
            screenY: rect.y,
          }));
        }
      }
    });
    observer.observe(el, { childList: true });
  });

  const products = store.locator('#products');
  const availableProducts = products.locator('.enabled');

  const upgrades = store.locator('#upgrades');
  const availableUpgrades = upgrades.locator('.enabled');

  const switches = store.locator('#toggleUpgrades');
  const enableSwitches = switches.locator('.enabled');

  return {
    withOptionMenu,
    clickCookie: async (timeout: number = 250) => {
      try {
        await cookie.click({ timeout });
        console.debug('[DEBUG]', new Date().toISOString(), 'clicked the big cookie');
      } catch {
        /* do nothing */
      }
    },
    buyProduct: async () => {
      const product = availableProducts.last();
      if (await product.count() > 0) {
        try {
          const productName = await product.locator('.productName').textContent();
          await say(`${productName}を買います。`);
          await product.click();
          console.debug('[DEBUG]', new Date().toISOString(), 'bought a product', productName);
        } catch {
          await say(`買えませんでした。`);
        }
      }
    },
    buyUpgrade: async () => {
      const upgrade = availableUpgrades.last();
      if (await upgrade.count() > 0) {
        try {
          const name = await tooltip.locator('.name').innerText();
          await say(`アップグレード「${name}」を買います`);
          await upgrade.click();
          const description = await tooltip.locator('.description').innerText();
          await say(`アップグレード「${name}」…${description}`);
          console.debug('[DEBUG]', new Date().toISOString(), `Bought an upgrade, ${name}`);
        } catch {
          await say(`買えませんでした。`);
        }
      }
    },
    pledgeElder: async () => {
      const elderPledger = enableSwitches.first();
      try {
        await elderPledger.hover();

        if ('エルダー宣誓' === await tooltip.locator('.name').innerText()) {
          try {
            await say(`エルダーの怒りをおさめさせ、シワシワ虫を駆除します。`);
            await elderPledger.click();
            console.debug('[DEBUG]', new Date().toISOString(), `Pledged the Elder.`);
          } catch (err) {
            console.warn('[WARN]', new Date().toISOString(), `Failed to pledge the elder: ${err}`);
          }
        }
      } catch {
        /* do nothing */
      }
    },
    importData: async (data: string) => {
      console.debug('[DEBUG]', new Date().toISOString(), 'importData');

      await page.locator('#game').press('Control+O');
      // console.debug(`Pressed Ctrl+O.`);

      await prompt.getByRole('textbox').fill(data);
      await prompt.getByText('ロード').click();

      await prompt.waitFor({ state: 'hidden', timeout: 60_000 });
      console.debug('[DEBUG]', new Date().toISOString(), `Imported!`);
    },
    exportData: async () => {
      console.debug('[DEBUG]', new Date().toISOString(), 'exportData');
      // console.debug(`Exporting data...`);

      let data: string | undefined;
      do {
        await withOptionMenu(async (menu) => {
          try {
            await menu.getByText('エクスポート').click();
          } catch (err) {
            console.warn('[WARN]', new Date().toISOString(), 'failed to export the game data', err);
            return;
          }

          try {
            data = await prompt.getByRole('textbox').inputValue({ timeout: 60_000 });
            console.debug('[DEBUG]', new Date().toISOString(), `Exported!`);
          } catch (err) {
            console.warn('[WARN]', new Date().toISOString(), 'failed to export the game data', err);
          } finally {
            await prompt.getByText('完了').click({ timeout: 600_000 });
            await prompt.waitFor({ state: 'hidden', timeout: 600_000 });
          }
        });
      } while (data === undefined);
      return data;
    },
    keepProductsView: async () => {
      try {
        await products.getByRole('button').nth(3).scrollIntoViewIfNeeded();
      } catch {
        /* nothing */
      }
    },
  };
};

chromium.use(StealthPlugin());

const browser = await chromium.launch({
  executablePath,
  headless: false,

  // https://peter.sh/experiments/chromium-command-line-switches/
  args: [
    '--hide-scrollbars',
    '--window-size=1024,576', // It may be required by `--window-position`.
    '--window-position=1280,600',
  ],
});

const ctx = await browser.newContext({
  viewport: {
    width: 1280,
    height: 720 + 32/* top bar */,
  },
});

const page = await ctx.newPage();
if (!page) {
  await ctx.close();
  await browser.close();
  throw new Error('could not create a page');
}

let data: string | undefined;
try {
  data = readFileSync(file, 'utf8');
} catch (err) {
  console.warn(err);
}

const config = {
  '高品質で描画': false,
  'CSSフィルター': false,
  'パーティクル': false,
  '数字': true,
  'ミルク': true,
  'カーソル': true,
  '動くクッキー': false,
  '別のクッキー音': false,
  'アイコンの枠': false,
  '別のフォント': false,
  '数字を短く表記': false,
  '短い通知': true,
  '終了警告': false,
  '追加ボタン': true,
  '砂糖玉使用の確認': false,
  'カスタムグランマ': false,
  '恐ろしいもの': true,
  'スリープモードのタイムアウト': true,
  'スクリーン リーダー モード': true,
};

let exitCode = 0;

const msPerTick = 250;
const ticksToSave = Math.floor(600_000 / msPerTick);
const ticksToBuyProduct = Math.floor(10_000 / msPerTick);
const ticksToBuyUpgrade = Math.floor(10_000 / msPerTick);
const ticksToPledge = Math.floor(1_000_000 / msPerTick);

const timeoutMs = 600_000_000;

try {
  const player = await CookieClicker(page);

  if (data) {
    player.importData(data);
  }

  // make sure that options are expected
  await player.withOptionMenu(async (menu) => {
    await menu.locator('#volumeSlider').fill('100');

    await Promise.all(
      Object.entries(config).map(async ([key, flag]) => {
        const link = menu.getByText(`${key} ON`).or(menu.getByText(`${key} OFF`));
        const text = await link.innerText();
        if (!text.endsWith(flag ? 'ON' : 'OFF')) {
          await link.click();
          console.debug(`Clicked "${key}"`);
        }
      }),
    );
  });

  ctx.setDefaultTimeout(1_000);

  // `start` is always the first `Date.now()`.
  // The first iteration starts after `tickMs` milliseconds.
  for await (const start of timersPromises.setInterval(msPerTick, Date.now())) {
    const elapsed = Date.now() - start;
    if (elapsed > timeoutMs) break;

    const ticks = Math.floor(elapsed / msPerTick) - 1; // `ticks` counts from zero.

    const actions: Promise<void>[] = [];

    if (ticks % ticksToSave === 0) {
      try {
        console.debug(`Saving data to the file "${file}"...`);
        const data = await player.exportData();
        if (data) {
          writeFileSync(file, data, 'utf8');
        } else {
          console.warn('[WARN]', new Date().toISOString(), 'Failed to export data.');
        }
      } catch (err) {
        console.warn('[WARN]', new Date().toISOString(), `Failed to save the data.`, err);
      }
    }

    if (ticks % ticksToBuyUpgrade === 0) {
      actions.push(player.buyUpgrade());
    }
    if (ticks % ticksToBuyProduct === 0) {
      actions.push(player.buyProduct());
    }
    if (ticks % ticksToPledge === 0) {
      actions.push(player.pledgeElder());
    }

    actions.push(
      player.keepProductsView(),
      player.clickCookie(),
    );

    await actions.reduce(async (p, next) => {
      return p.then(async () => await next);
    }, Promise.resolve());
  }
} catch (err) {
  console.error(err);
  exitCode = 1;
} finally {
  await ctx.close();
  await browser.close();

  process.exit(exitCode);
}