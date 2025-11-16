import type { Statistics } from "./player";

type Dict = Record<string, keyof Statistics[keyof Statistics]>;

const dict = {
  '日本語': {
    '貯まったクッキー：': 'cookiesInBank',
    'クッキー生産数（今回の昇天）：': 'cookiesBakedInThisAscension',
    'クッキー生産数（全期間）：': 'cookiesBakedInTotal',
    '昇天で失ったクッキー：': 'cookiesForfeitedByAscending',
    '所有建物：': 'buildingsOwned',
    '1クリックあたりの生産数：': 'cookiesPerClick',
    'クリック回数：': 'cookieClicks',
    '手作りクッキー：': 'handmadeCookies',
    '実行中のバージョン：': 'runningVersion',
  },
} satisfies Record<string, Dict>;

const isKnownLang = (lang: string): lang is keyof typeof dict => Object.hasOwn(dict, lang);

export const dictOf = (lang: string) => {
  if (isKnownLang(lang)) {
    const d = dict[lang] as Dict;
    return (key: string, innerText: string) => {
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
              : {}
          ),
        },
      ] as const;
    }
  } else {
    return (key: string, innerText: string) => [key, { innerText }] as const;
  }
};