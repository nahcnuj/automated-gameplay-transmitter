#!/usr/bin/env bun

import { readFileSync, writeFileSync } from "node:fs";
import { setInterval, setTimeout } from "node:timers/promises";
import { parseArgs } from "node:util";
import type { Locator, Page } from "playwright";
import { createSender, dictOf, type Statistics } from "../src/games/cookieclicker";
import { chromium } from "../src/lib/chromium";

console.debug = console.log;

const { values: {
  file,
  browser: executablePath,
  lang,
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
    lang: {
      type: 'string',
      default: '日本語',
    },
  },
});

const parse = dictOf(lang);

const say = async (text: string) => {
  try {
    console.debug(`${new Date().toLocaleString()}: ${text}`);
    await fetch('http://localhost:7777/api/talk', {
      method: 'POST',
      body: text,
    });
    await setTimeout(50 * text.length);
  } catch (err) {
    console.warn(err);
  }
};

const CookieClicker = async (page: Page) => {
  await page.goto('https://orteil.dashnet.org/cookieclicker/', { timeout: 300_000 });

  await page.getByText(lang).click({ timeout: 300_000 });
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
  const ascendNumber = page.locator('#ascendNumber');
  const cookie = page.locator('#bigCookie');
  const tooltip = page.locator('#tooltipAnchor');
  const store = page.locator('#store');
  const prompt = page.locator('#prompt');
  const ascend = page.locator('#ascend');

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

  let isAscending = false;

  return {
    withOptionMenu,
    withStatsMenu,
    get cookies() { return cookies.innerText().then(s => s.replaceAll(',', '')).then(Number.parseFloat) },
    get cookiesPerSecond() { return cookiesPerSecond.innerText().then(s => s.replaceAll(/[^0-9.e+]/g, '')).then(Number.parseFloat) },
    get isWrinkled() { return cookiesPerSecond.getAttribute('class').then((s = '') => (s ?? '').split(' ').includes('wrinkled')) },
    get isAscending() { return isAscending },
    get ascendNumber() { return ascendNumber.innerText().then(s => s.replaceAll(',', '')).then(Number.parseFloat).then(n => Number.isNaN(n) ? 0 : n) },
    get commentsText() { return commentsText.innerText() },
    get bulkMode() { return bulkMode.getAttribute('id').then(id => id?.substring('storeBulk'.length).toLowerCase()) },
    get products() {
      return products.getByRole('button').all().then(ls => ls.map(async (l) => ({
        name: await l.locator('.productName').innerText(),
        mult: await l.locator('.priceMult').innerText().then(s => {
          const parsed = Number.parseInt(s.substring(1));
          return Number.isNaN(parsed) ? 1 : parsed;
        }),
        price: await l.locator('.price').innerText().then(s => s.replaceAll(',', '')).then(Number.parseFloat),
        enabled: await l.getAttribute('class').then((s = '') => (s ?? '').split(' ').includes('enabled')),
      })))
    },
    get upgrades() {
      return upgrades.getByRole('button').all().then(ls => ls.slice(0, 5).map(async (l) => ({
        enabled: await l.getAttribute('class').then((s = '') => (s ?? '').split(' ').includes('enabled')),
      })));
    },
    get switches() {
      return switches.getByRole('button').all().then(ls => ls.slice(0, 5).map(async (l) => ({
        enabled: await l.getAttribute('class').then((s = '') => (s ?? '').split(' ').includes('enabled')),
      })));
    },
    get elderPledgeSwitch() {
      const btn = switches.getByRole('button').first();
      return btn.getAttribute('class').then(c => c?.split(' ').includes('enabled')).catch(() => false).then(async (enabled = false) => ({
        enabled,
        description: enabled ? await btn.hover({ timeout: msPerTick / 2 }).then(async () => await btn.innerText()).catch(() => undefined) : undefined,
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
      console.debug('[DEBUG]', new Date().toISOString(), 'buyProduct', name);
      try {
        await say(`${name}を買います`);
        await products.getByRole('button', { name }).last().click();
      } catch (err) {
        console.warn('[WARN]', `could not buy ${name}`, err);
        await say(`買えませんでした`);
      }
    },
    buyUpgrade: async (name?: string) => {
      console.debug('[DEBUG]', new Date().toISOString(), 'buyUpgrade', name); // TODO name
      const upgrade = availableUpgrades.last();
      if (await upgrade.count() > 0) {
        await upgrade.hover();
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
      const btn = switches.getByRole('button', { name: 'エルダー宣誓' });
      try {
        if (await btn.getAttribute('class').then((c) => c?.split(' ').includes('enabled')).catch(() => false)) {
          await btn.click();
          await say(`エルダーの怒りをおさめさせ、シワシワ虫を駆除しました`);
        }
      } catch {
        /* do nothing */
      }
    },
    ascend: async () => {
      console.debug('[DEBUG]', new Date().toISOString(), 'ascend');

      try {
        console.debug('[DEBUG]', 'ascend 100');
        await say('昇天します');

        isAscending = true;

        console.debug('[DEBUG]', 'ascend 200');
        if (!await prompt.isVisible()) {
          console.debug('[DEBUG]', 'ascend 210');
          await commentsArea.getByText('遺産').click({ timeout: 60_000 });
        }
        console.debug('[DEBUG]', 'ascend 300');
        await prompt.waitFor({ state: 'visible', timeout: 60_000 });
        console.debug('[DEBUG]', 'ascend 400');
        await prompt.locator('a', { hasText: '昇天する' }).click({ timeout: 60_000 });

        console.debug('[DEBUG]', 'ascend 500');
        await ascend.waitFor({ state: 'visible', timeout: 60_000 });
      } catch (err) {
        console.warn('[WARN]', 'failed to ascend', err);
      } finally {
        await page.keyboard.press('Escape');
      }
    },
    reincarnate: async () => {
      console.debug('[DEBUG]', new Date().toISOString(), 'reincarnate');

      try {
        await say('転生します');

        await page.locator('a', { hasText: '転生する' }).click({ timeout: 60_000 });
        await prompt.locator('a', { hasText: 'はい' }).click({ timeout: 60_000 });

        await ascend.waitFor({ state: 'hidden', timeout: 60_000 });
        isAscending = false;
      } catch (err) {
        console.warn('[WARN]', 'failed to reincarnate', err);
      } finally {
        await page.keyboard.press('Escape');
      }
    },
    importData: async (data: string) => {
      console.debug('[DEBUG]', new Date().toISOString(), 'importData');

      await page.locator('#game').press('Control+O');

      await prompt.getByRole('textbox').fill(data);
      await prompt.getByText('ロード').click();

      await prompt.waitFor({ state: 'hidden', timeout: 60_000 });
      console.debug('[DEBUG]', new Date().toISOString(), `Imported!`);
    },
    exportData: async () => {
      console.debug('[DEBUG]', new Date().toISOString(), 'exportData');

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
        await products.getByRole('button').nth(2).scrollIntoViewIfNeeded({ timeout: 100 });
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

const msPerTick = 5_000;
const ticksToStats = Math.floor(2_000_000 / msPerTick);
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

  let ready = true;
  let statistics: Statistics | undefined;

  const send = createSender(async (data) => {
    console.log('[DEBUG]', 'action', data);
    switch (data.action) {
      case undefined: {
        // do nothing
        return;
      }
      case 'click': {
        await player.clickCookie(1_000);
        return;
      }
      case 'buyProduct': {
        await player.buyProduct(data.name);
        return;
      }
      case 'toggleSwitch': {
        // TODO
        await player.pledgeElder();
        return;
      }
      case 'buyUpgrade': {
        await player.buyUpgrade(data.name);
        return;
      }
      case 'ascend': {
        console.log('[DEBUG]', 'ascend', 'start');
        await player.ascend();
        statistics = undefined;
        await setTimeout(10_000);
        console.log('[DEBUG]', 'ascend', 'end');
        return;
      }
      case 'reincarnate': {
        await player.reincarnate();
        await setTimeout(10_000);
        return;
      }
      default: {
        console.warn('[WARN]', 'unknown action');
        return;
      }
    }
  });

  // `start` is always the first `Date.now()`.
  // The first iteration starts after `tickMs` milliseconds.
  for await (const start of setInterval(msPerTick, Date.now())) {
    ctx.pages().slice(1).forEach(async (p) => await p.close());
    if (ready) {
      ready = false;

      const elapsed = Date.now() - start;
      if (elapsed > timeoutMs) break;

      const ticks = Math.floor(elapsed / msPerTick); // `ticks` counts from one.

      const seq: Promise<unknown>[] = [
        player.keepProductsView(),
      ];

      seq.push(Promise.all([
        (async () => {
          send(player.isAscending ? {
            modal: 'ascending',
            // TODO
          } : {
            ticks,
            cookies: await player.cookies,
            cps: await player.cookiesPerSecond,
            isWrinkled: await player.isWrinkled,
            ascendNumber: await player.ascendNumber,
            commentsText: await player.commentsText,
            store: {
              products: {
                bulkMode: await player.bulkMode !== 'sell' ? 'buy' : 'sell',
                items: await Promise.all(await player.products),
              },
              upgrades: await Promise.all(await player.upgrades),
              switches: await Promise.all(await player.switches),
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

      if (!statistics || ticks % ticksToStats === 0) {
        seq.push(
          new Promise(async (resolve) => {
            statistics = await player.withStatsMenu(async (menu) => {
              const generalSection = menu.locator('.subsection', { hasText: '全般' });
              const general = await generalSection.locator('.listing').all().then(ls => Promise.all(ls.map(async (l) => {
                const key = await l.locator('b').innerText().then(s => s.trim());
                const innerText = await l.innerText().then(s => s.substring(key.length).trim());
                return parse(key, innerText);
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

      ready = true;
    }
  }
} catch (err) {
  console.error('[ERROR]', err);
  exitCode = 1;
} finally {
  await ctx.close();
  await browser.close();

  process.exit(exitCode);
}