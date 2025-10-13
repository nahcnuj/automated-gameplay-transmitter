#!/usr/bin/env bun

import { readFileSync, writeFileSync } from "node:fs";
import timersPromises from "node:timers/promises";
import { parseArgs } from "node:util";
import { chromium, type Locator, type Page } from "playwright";

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
  await page.goto('https://orteil.dashnet.org/cookieclicker/', { timeout: 30_000 });

  await page.getByText('日本語').click({ timeout: 30_000 });
  console.debug(`日本語`);

  await page.getByText('Got it').click({ timeout: 30_000 });
  console.debug(`Got it!`);

  await page.getByText('次回から表示しない').click({ timeout: 30_000 });
  console.debug(`Do not show again`);

  const withOptionMenu = async (callback: (menu: Locator) => Promise<void>) => {
    const menu = page.locator('#menu');
    if (!await menu.isVisible()) {
      const options = page.locator('.subButton', { hasText: 'オプション' });
      await options.click({ timeout: 30_000 });
      console.debug(`Clicked the option button.`);

      await menu.waitFor({ state: 'visible' });
      console.debug(`Opened the menu.`);
    }

    await callback(menu);

    await menu.locator('.close').click();
    console.debug(`Clicked the close button.`);
    await menu.waitFor({ state: 'hidden' });
    console.debug(`Closed the menu.`);
  };

  const cookie = page.locator('#bigCookie');

  const tooltip = page.locator('#tooltipAnchor');

  const store = page.locator('#store');
  const switches = store.locator('#toggleUpgrades');
  const enableSwitches = switches.locator('.enabled');

  return {
    withOptionMenu,
    clickCookie: async () => {
      try {
        await cookie.click({ timeout: 200 });
      } catch {
        /* do nothing */
      }
    },
    pledgeElder: async () => {
      try {
        const elderPledger = enableSwitches.first();
        await elderPledger.hover();

        if ('エルダー宣誓' === await tooltip.locator('.name').innerText()) {
          await say(`エルダーの怒りをおさめさせ、シワシワ虫を駆除します。`);
          await elderPledger.click();
          console.debug(`Pledged the Elder.`);
        } else {
          console.warn(`Not found Elder Pledger.`);
        }
      } catch (err) {
        console.warn(`Failed to pledge the elder: ${err}`);
        /* do nothing */
      }
    },
    importData: async (data: string) => {
      console.debug(`Importing data...`);

      await page.locator('#game').press('Control+O');
      console.debug(`Pressed Ctrl+O.`);

      const prompt = page.locator('#prompt');

      await prompt.getByRole('textbox').fill(data);
      await prompt.getByText('ロード').click();

      await prompt.waitFor({ state: 'hidden' });
      console.debug(`Imported!`);
    },
    exportData: async () => {
      console.debug(`Exporting data...`);

      let data: string | undefined;
      await withOptionMenu(async (menu) => {
        await menu.getByText('エクスポート').click();
        console.debug(`Clicked the exporting button`);

        const prompt = page.locator('#prompt');
        console.debug(`Popped up the exporting menu.`);

        data = await prompt.getByRole('textbox').inputValue();

        await prompt.getByText('完了').click();
        await prompt.waitFor({ state: 'hidden' });
        console.debug(`Exported!`);
      });
      return data;
    }
  };
};

const browser = await chromium.launch({
  executablePath,
  headless: false,
  args: [
    '--window-size=1024,576',
    '--window-position=1280,600',
  ],
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

const shopper = setInterval(async () => {
  const shop = page.locator('#store');

  try {
    const upgradable = shop.locator('#upgrades').locator('.enabled');
    if (await upgradable.count() > 0) {
      const mostExpensive = upgradable.first();
      await mostExpensive.hover();

      const tooltip = page.locator('#tooltipAnchor');
      const name = await tooltip.locator('.name').innerText();
      await say(`アップグレード ${name}を 買います`);
      const description = await tooltip.locator('.description').innerText();
      await say(description);
      await mostExpensive.click();
      console.debug(`Bought an upgrade, ${name}`);

      return;
    }

    const purchasable = shop.locator('#products').locator('.enabled');
    if (await purchasable.count() > 0) {
      const mostExpensive = purchasable.last();

      const name = await mostExpensive.locator('.productName').textContent();
      await say(`${name}を買います`);
      await mostExpensive.click();

      console.debug(`Bought a product, ${name}`);
    }
  } catch (err) {
    console.warn(err);
  }
}, 1_000);

const notifier = setInterval(async () => {
  const notes = page.locator('#notes');

  for (const l of await notes.locator('.note', { hasText: '実績が解除' }).all()) {
    try {
      const title = await l.getByRole('heading', { level: 5 }).textContent();
      await say(`${title} 実績が解除されました！`);
      await l.locator('.close').click();

      console.debug(`Closed a notification about an achievement, ${title}`);
    } catch (err) {
      console.warn(err);
    }
  }
}, 1_000);

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
let intervals: NodeJS.Timeout[] = [
  shopper,
  notifier,
];

const tickMs = 250;
const timeoutMs = 6_000_000;
const ticksToSave = Math.floor(600_000 / tickMs);
const ticksToPledge = Math.floor(1_000_000 / tickMs);

try {
  const player = await CookieClicker(page);

  if (data) {
    player.importData(data);
  }

  // make sure that options are expected
  await player.withOptionMenu(async (menu) => {
    await menu.locator('#volumeSlider').fill('100');

    await Promise.all(
      Object.entries(config).map(async ([text, flag]) => {
        const link = menu.getByText(`${text} ON`).or(menu.getByText(`${text} OFF`));
        console.debug(`${text}, ${flag}, ${await link.innerText()}`);
        if (await link.innerText().then(async (text) => !text.endsWith(flag ? 'ON' : 'OFF'))) {
          await link.click();
          console.debug(`Clicked "${text}"`);
        }
      })
    );
  });

  ctx.setDefaultTimeout(1_000);

  // `start` is always the first `Date.now()`.
  // The first iteration starts after `intervalMs` milliseconds.
  // Therefore, `count` starts from one.
  for await (const start of timersPromises.setInterval(tickMs, Date.now())) {
    const elapsed = Date.now() - start;
    if (elapsed > timeoutMs) break;

    const ticks = Math.floor(elapsed / tickMs);
    // console.debug(`Tick #${ticks}`);

    // Save data regularly
    if (ticks % ticksToSave === 0) {
      try {
        console.debug(`Exporting to ${file}`);
        const data = await player.exportData();
        if (data) {
          writeFileSync(file, data, 'utf8');
        } else {
          console.warn('Failed to export data.');
        }
      } catch (err) {
        console.warn(`Failed to save the data.`, err);
      }
      continue;
    }

    // Pledge the Elder
    if (ticks % ticksToPledge === 0) {
      await player.pledgeElder();
      continue;
    }

    // Otherwise, click cookie
    await player.clickCookie();
  }
} catch (err) {
  console.error(err);
  exitCode = 1;
} finally {
  intervals.forEach(clearInterval);

  await ctx.close();
  await browser.close();

  process.exit(exitCode);
}