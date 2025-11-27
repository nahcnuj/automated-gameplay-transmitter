import type { State } from "./player";

export const sight = (): State => {
  const parseNumber = (text?: string): number => text ? Number.parseFloat(text.replaceAll(',', '')) : Number.NaN;

  const cookiesPerSecond = document.getElementById('cookiesPerSecond');

  const common = {
    cookies: parseNumber(document.getElementById('cookies')?.innerText.replaceAll(',', '')),
    cps: parseNumber(cookiesPerSecond?.innerText.replaceAll(/[^0-9.e+]/g, '')),
    isWrinkled: cookiesPerSecond?.classList.contains('wrinkled') ?? false,
    ascendNumber: parseNumber(document.getElementById('ascendNumber')?.innerText.replaceAll(',', '')),
    commentsText: document.getElementById('commentsText')?.innerText,
    store: {
      products: {
        bulkMode: Array.from(document.getElementsByClassName('storeBulkMode')).filter(({ classList }) => classList.contains('selected')).at(0)?.id.substring('storeBulk'.length).toLowerCase() as 'buy' | 'sell',
        items: [], // TODO
      },
      upgrades: [], // TODO
      tech: [], // TODO
      switches: [], // TODO
    },
  };

  const menu = document.getElementById('menu');
  if (!menu) return common;
  console.debug('[DEBUG]', '#menu', menu);

  const sections = Array.from(menu.getElementsByClassName('section'));
  console.debug('[DEBUG]', '.section', sections);

  const statistics = (sections => {
    const section = sections.find(el => el.textContent.includes('記録'));
    if (section === undefined) return;

    const subsections = Array.from(menu.getElementsByClassName('subsection'));
    console.debug('[DEBUG]', '.subsection', subsections);

    const general = (subsections => {
      const subsection = subsections.find(el => el.textContent.includes('全般'));
      if (subsection === undefined) throw new Error('unexpected condition');

      return Object.fromEntries(
        Array.from(subsection.getElementsByClassName('listing'))
          .map(el => {
            const key = Array.from(el.getElementsByTagName('b')).map((el) => el.innerText).join('').trim();
            const innerText = el.textContent.substring(key.length);
            return [key, { innerText }] as const;
          }),
      );
    })(subsections);

    return {
      general,
    };
  })(sections);
  console.debug('[DEBUG]', 'statistics', statistics);

  return {
    ...common,
    statistics,
  };
};
