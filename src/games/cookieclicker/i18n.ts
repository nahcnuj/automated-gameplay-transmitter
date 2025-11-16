import type { Statistics } from "./player";

type Dict = Record<string, keyof Statistics[keyof Statistics]>;

const dict = {
  '日本語': {
    '貯まったクッキー：': 'cookiesInBank',
    'クッキー生産数（今回の昇天）：': 'cookiesBakedInThisAscension',
    'クッキー生産数（全期間）：': 'cookiesBakedInTotal',
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
            ['cookiesInBank', 'cookiesBakedInThisAscension', 'cookiesBakedInTotal']
              .includes(k)
              ? { value: Number.parseFloat(innerText) }
              : {}
          ),
        },
      ] as const;
    }
  } else {
    return (key: string, innerText: string) => [key, { innerText }] as const;
  }
};