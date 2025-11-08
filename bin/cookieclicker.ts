#!/usr/bin/env bun

import { readFileSync, writeFileSync } from "node:fs";
import timersPromises from "node:timers/promises";
import { parseArgs } from "node:util";
import type { Locator, Page } from "playwright";
import { createSender, type Statistics } from "../src/games/cookieclicker";
import { chromium } from "../src/lib/chromium";

console.debug = console.log;

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

  const commentsArea = page.locator('#comments');
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

  const withStatsMenu = async <T>(callback: (menu: Locator) => Promise<T>) => {
    try {
      console.debug('[DEBUG]', new Date().toISOString(), 'withStatsMenu');

      if (await menu.getByText('記録').count() <= 0) {
        await commentsArea.getByText('記録').click({ timeout: 60_000 });

        await menu.waitFor({ state: 'visible', timeout: 60_000 });
      }

      const res = await callback(menu);

      await menu.locator('.close').click({ timeout: 60_000 });
      await menu.waitFor({ state: 'hidden', timeout: 60_000 });

      return res;
    } catch (err) {
      console.warn('[WARN]', 'withStatsMenu', err);
    }
  };

  const cookies = page.locator('#cookies');
  const cookiesPerSecond = page.locator('#cookiesPerSecond');

  const commentsText = page.locator('#commentsText');

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
  const bulkMode = products.locator('.storeBulkMode.selected');

  const upgrades = store.locator('#upgrades');
  const availableUpgrades = upgrades.locator('.enabled');

  const switches = store.locator('#toggleUpgrades');
  const enableSwitches = switches.locator('.enabled');

  return {
    withOptionMenu,
    withStatsMenu,
    get cookies() { return cookies.innerText().then(Number.parseFloat) },
    get cookiesPerSecond() { return cookiesPerSecond.innerText().then(s => s.replaceAll(/[^0-9.e+]/g, '')).then(Number.parseFloat) },
    get isWrinkled() { return cookiesPerSecond.getAttribute('class').then((s = '') => (s ?? '').split(' ').includes('wrinkled')) },
    get commentsText() { return commentsText.innerText() },
    get bulkMode() { return bulkMode.getAttribute('id').then(id => id?.substring('storeBulk'.length).toLowerCase()) },
    get products() {
      return products.getByRole('button').all().then(ls => ls.map(async (l) => ({
        name: await l.locator('.productName').innerText(),
        mult: await l.locator('.priceMult').innerText().then(s => {
          const parsed = Number.parseInt(s.substring(1));
          return Number.isNaN(parsed) ? 1 : parsed;
        }),
        price: await l.locator('.price').innerText().then(Number.parseFloat),
        enabled: await l.getAttribute('class').then((s = '') => (s ?? '').split(' ').includes('enabled')),
      })))
    },
    get upgrades() {
      return upgrades.getByRole('button', { disabled: false }).all().then(ls => ls.slice(0, 1).map(async (l, i) => {
        await timersPromises.setTimeout(i * msPerTick);

        const enabled = await l.getAttribute('class').then((s = '') => (s ?? '').split(' ').includes('enabled'));
        if (enabled) {
          try {
            await l.hover({ timeout: msPerTick });
            return {
              description: await l.innerText(),
              enabled,
            };
          } catch (err) {
            console.warn('[WARN]', err);
            return {
              enabled,
            };
          }
        } else {
          return {
            enabled: false,
          };
        }
      }));
    },
    get elderPledgeSwitch() {
      const name = 'エルダー宣誓';
      const btn = switches.getByRole('button', { name });
      return Promise.all([
        btn.isEnabled(),
        btn.innerHTML().then(v => console.debug('[DEBUG]', v)),
      ]).then(([
        enabled,
      ]) => ({
        name,
        enabled,
      })).catch(() => ({
        name,
        enabled: false,
      }));
    },
    clickCookie: async (timeout: number = 250) => {
      try {
        await cookie.click({ timeout });
        console.debug('[DEBUG]', new Date().toISOString(), 'clicked the big cookie');
      } catch {
        /* do nothing */
      }
    },
    buyProduct: async (name: string) => {
      console.debug('[DEBUG]', new Date().toISOString(), 'buy', name);
      try {
        await say(`${name}を買います`);
        await products.getByRole('button', { name }).click();
      } catch (err) {
        console.warn('[WARN]', `could not buy ${name}`, err);
        await say(`買えませんでした`);
      }
    },
    buyUpgrade: async () => {
      const upgrade = availableUpgrades.last();
      if (await upgrade.count() > 0) {
        try {
          const name = await tooltip.locator('.name').innerText();
          const description = await tooltip.locator('.description').innerText();
          console.debug('[DEBUG]', new Date().toISOString(), `buy an upgrade, ${name}`);
          await say(`アップグレード「${name}」を買います。${description}`);
          await upgrade.click();
        } catch {
          await say(`買えませんでした`);
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

const msPerTick = 1_000;
const ticksToStats = Math.floor(60_000 / msPerTick);
const ticksToSave = Math.floor(600_000 / msPerTick);

const timeoutMs = 600_000_000;

try {
  const player = await CookieClicker(page);

  try {
    const data = readFileSync(file, 'utf8');
    player.importData(data);
  } catch (err) {
    console.warn('[WARN]', 'failed to load data', err);
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
          console.log(`Clicked "${key}"`);
        }
      }),
    );
  });

  ctx.setDefaultTimeout(msPerTick);

  const send = createSender(async (data) => {
    console.log('[DEBUG]', 'action', data);
    switch (data.action) {
      case 'click': {
        await player.clickCookie(1_000);
        break;
      }
      case 'buyProduct': {
        await player.buyProduct(data.name);
        break;
      }
      case 'toggleSwitch': {
        // TODO
        await player.pledgeElder();
        break;
      }
      case 'buyUpgrade': {
        // TODO
        await player.buyUpgrade();
        break;
      }
      default: {
        console.warn('[WARN]', 'unknown action');
        break;
      }
    }
  });

  // `start` is always the first `Date.now()`.
  // The first iteration starts after `tickMs` milliseconds.
  for await (const start of timersPromises.setInterval(msPerTick, Date.now())) {
    const elapsed = Date.now() - start;
    if (elapsed > timeoutMs) break;

    const ticks = Math.floor(elapsed / msPerTick); // `ticks` counts from one.

    let statistics: Statistics | undefined;

    const seq: Promise<unknown>[] = [
      player.keepProductsView(),
    ];

    seq.push(Promise.all([
      (async () => {
        send({
          ticks,
          cookies: await player.cookies,
          cps: await player.cookiesPerSecond,
          isWrinkled: await player.isWrinkled,
          commentsText: await player.commentsText,
          store: {
            products: {
              bulkMode: await player.bulkMode !== 'sell' ? 'buy' : 'sell',
              items: await Promise.all(await player.products),
            },
            upgrades: await Promise.all(await player.upgrades),
            switches: [
              await player.elderPledgeSwitch,
            ],
          },
          statistics,
        });
      })(),
    ]));

    if (ticks % ticksToSave === 0) {
      seq.push((async () => {
        try {
          const data = await player.exportData();
          if (data) {
            writeFileSync(file, data, 'utf8');
            console.log('[INFO]', `Saved data to the file "${file}"`);
          } else {
            console.warn('[WARN]', new Date().toISOString(), 'Failed to export data.');
          }
        } catch (err) {
          console.warn('[WARN]', new Date().toISOString(), `Failed to save the data.`, err);
        }
      })());
    }

    if (ticks % ticksToStats === 0) {
      seq.push(
        new Promise(async (resolve) => {
          statistics = await player.withStatsMenu(async (menu) => {
            const generalSection = menu.locator('.subsection', { hasText: '全般' });
            const general = await generalSection.locator('.listing').all().then(ls => Promise.all(ls.map(async (l) => {
              const key = await l.locator('b').innerText();
              const textContent = await l.innerText().then(s => s.substring(key.length));
              return [key, {
                textContent,
              }];
            }))).then(Object.fromEntries);
            console.log('[DEBUG]', general);
            return {
              general,
            };
          });
          resolve(null);
        }),
      );
    }

    await seq.reduce(async (p, next) => {
      return p.then(async () => await next);
    }, Promise.resolve());
  }
} catch (err) {
  console.error('[ERROR]', err);
  exitCode = 1;
} finally {
  await ctx.close();
  await browser.close();

  process.exit(exitCode);
}