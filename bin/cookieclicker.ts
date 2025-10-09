#!/usr/bin/env bun

import { readFileSync, writeFileSync } from "node:fs";
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

// {
//   const cdp = await ctx.newCDPSession(page);
//   await cdp.send('Emulation.setCPUThrottlingRate', { rate: 5 });
//   // await cdp.detach();
// }

const CookieClicker = async (page: Page) => {
  await page.goto('https://orteil.dashnet.org/cookieclicker/');

  await page.getByText('日本語').click();
  console.debug(`日本語`);

  await page.getByText('Got it').click();
  console.debug(`Got it!`);

  await page.getByText('次回から表示しない').click();
  console.debug(`Do not show again`);

  const withOptionMenu = async (callback: (menu: Locator) => Promise<void>) => {
    const options = page.locator('.subButton', { hasText: 'オプション' });
    await options.click();
    console.debug(`Clicked the option button.`);

    const menu = page.locator('#menu');
    await menu.waitFor({ state: 'visible' });
    console.debug(`Opened the menu.`);

    await callback(menu);

    await menu.locator('.close').click();
    console.debug(`Clicked the close button.`);
    await menu.waitFor({ state: 'hidden' });
    console.debug(`Closed the menu.`);
  };

  return {
    withOptionMenu,
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

try {
  const player = await CookieClicker(page);

  if (data) {
    player.importData(data);
  }

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

  setInterval(async () => {
    const data = await player.exportData();
    if (!data) {
      console.warn(`Failed to export.`);
      return;
    }

    try {
      writeFileSync(file, data, 'utf8');
    } catch (err) {
      console.warn(`Failed to save the data.`, err);
    }
  }, 600_000);
} catch (err) {
  console.error(err);
  process.exit(1);
}

// if (data) {
//   console.debug(`Importing...`);

//   const options = page.locator('.subButton', { hasText: 'オプション' });
//   await options.click();
//   console.debug(`Clicked the option button.`);

//   const menu = page.locator('#menu');

//   await menu.press('Control+O');
//   console.debug(`Pressed Ctrl+O.`);

//   const popup = page.locator('#prompt');

//   await popup.getByRole('textbox').fill(data);
//   await popup.getByText('ロード').click();

//   await popup.waitFor({ state: 'hidden' });
//   console.debug(`Imported!`);

//   await menu.locator('.close').click();
//   console.debug(`Closed the menu.`);
// } else {
//   console.debug(`Initializing...`);

//   const options = page.locator('.subButton', { hasText: 'オプション' });
//   await options.click();
//   console.debug(`Clicked the option button.`);

//   const menu = page.locator('#menu');

//   await menu.locator('#volumeSlider').fill('100');
//   console.debug(`Made the volume maximum.`);

//   try {
//     await menu.getByText(/高品質.*ON/i).click();
//     console.debug(`Turned off high quality.`);
//   } catch {
//     // do nothing
//   }

//   try {
//     await menu.getByText(/CSS.*ON/i).click();
//     console.debug(`Turned off CSS filters.`);
//   } catch {
//     // do nothing
//   }

//   try {
//     await menu.getByText(/パーティクル.*ON/i).click();
//     console.debug(`Turned off particles.`);
//   } catch {
//     // do nothing
//   }

//   await menu.locator('.close').click();
//   console.debug(`Closed the menu.`);
// }

ctx.setDefaultTimeout(1_000);

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

const clicker = setInterval(async () => {
  const bigCookie = page.locator('#bigCookie');
  try {
    await bigCookie.click({ timeout: 200 });
  } catch {
    // do nothing
  }
}, 250);

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

      return;
    }

    const purchasable = shop.locator('#products').locator('.enabled');
    if (await purchasable.count() > 0) {
      const mostExpensive = purchasable.last();

      const name = await mostExpensive.locator('.productName').textContent();
      await say(`${name}を買います`);
      await mostExpensive.click();
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
    } catch (err) {
      console.warn(err);
    }
  }
}, 1_000);

// const exporter = setInterval(async () => {
//   console.debug(`Exporting...`);
//   try {
//     const options = page.locator('.subButton', { hasText: 'オプション' });
//     await options.click();
//     console.debug(`Clicked the option button.`);

//     const menu = page.locator('#menu');
//     const exportBtn = menu.getByText('エクスポート');
//     await exportBtn.hover();
//     await exportBtn.click();
//     console.debug(`Clicked the exporting button`);

//     const popup = page.locator('#prompt');
//     console.debug(`Popped up the exporting menu.`);

//     data = await popup.getByRole('textbox').inputValue();
//     writeFileSync(file, data, 'utf8');

//     await popup.getByText('完了').click();
//     await popup.waitFor({ state: 'hidden' });
//     console.debug(`Exported!`);

//     await menu.locator('.close').click();
//     console.debug(`Closed the menu.`);
//   } catch (err) {
//     console.warn('Failed to save.', err);
//   }
// }, 600_000);

const elderPledger = setInterval(async () => {
  try {
    const pledger = page.locator('#store').locator('#toggleUpgrades').locator('.enabled').first();
    await pledger.hover();

    const tooltip = page.locator('#tooltipAnchor');
    const name = await tooltip.locator('.name').innerText();
    if (name === 'エルダー宣誓') {
      await say(`エルダーの怒りをおさめさせ、シワシワ虫を駆除します。`);
      await pledger.click();
    }
  } catch (err) {
    console.warn(err);
  }
}, 1_000_000);

setTimeout(async () => {
  clearInterval(clicker);
  clearInterval(shopper);
  clearInterval(notifier);
  // clearInterval(exporter);
  clearInterval(elderPledger);
  await ctx.close();
  await browser.close();
}, 12 * 60 * 60 * 1000);