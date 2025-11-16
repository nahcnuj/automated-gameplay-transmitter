import type { Statistics } from "./player";

type Dict = Record<string, keyof Statistics[keyof Statistics]>;

const dict = {
  '日本語': {
    '貯まったクッキー：': 'cookiesInBank',
    'クッキー生産数（今回の昇天）：': 'cookiesBakedInThisAscension',
    'クッキー生産数（全期間）：': 'cookiesBakedInTotal',
    '昇天で失ったクッキー：': 'cookiesForfeitedByAscending',
    '遺産の始まり：': 'legacyStarted',
    '所有建物：': 'buildingsOwned',
    '1クリックあたりの生産数：': 'cookiesPerClick',
    'クリック回数：': 'cookieClicks',
    '手作りクッキー：': 'handmadeCookies',
    '実行中のバージョン：': 'runningVersion',
  },
} satisfies Record<string, Dict>;

const parser = {
  '日本語': {
    legacyStarted: (innerText: string) => ({
      ascensions: innerText.endsWith('回') ? Number.parseInt(innerText.match(/[0-9,.e+]+回/)?.[0].replaceAll(',', '') ?? 'N/A') : 0,
    }),
  },
};

const isKnownLang = (lang: string): lang is keyof typeof dict => Object.hasOwn(dict, lang);

export const dictOf = (lang: string) => {
  if (isKnownLang(lang)) {
    const d = dict[lang] as Dict;
    const parse = parser[lang];
    return (key: string, innerText: string): [typeof key, Statistics['general'][typeof key]] => {
      const k = d[key] ?? key;
      return [
        k,
        {
          innerText,
          ...(
            [
              'cookiesInBank',
              'cookiesBakedInThisAscension',
              'cookiesBakedInTotal',
              'cookiesForfeitedByAscending',
              'buildingsOwned',
              'cookiesPerClick',
              'cookieClicks',
              'handmadeCookies',
            ].includes(k)
              ? { value: Number.parseFloat(innerText.replaceAll(',', '')) }
              : k === 'legacyStarted'
                ? parse.legacyStarted(innerText)
                : {}
          ),
        },
      ] as const;
    }
  } else {
    return (key: string, innerText: string) => [key, { innerText }] as const;
  }
};