import { readFileSync, statSync, writeFileSync } from "node:fs";

type WeightedCandidates = Record<string, number>;

type MarkovModel = {
  /** initial word candidates */
  '': WeightedCandidates
  /** candidates following by `word` */
  [word: string]: WeightedCandidates
};

const pick = (cands: WeightedCandidates) => {
  const total = Math.sumPrecise(Object.values(cands));
  const rnd = Math.floor(Math.random() * total);
  const [next,]: [string, number] = Object.entries(cands).reduce(([w, s], [word, weight]) => {
    if (s > rnd) {
      return [w, s];
    }
    return [word, s + weight];
  }, ['', 0]);
  return next;
};

const talk = (model: MarkovModel, bos: string[]) => {
  let s = [bos[Math.floor(Math.random() * bos.length)] ?? '。'];
  while (s.at(-1) !== '。' && s.length < 10 && [...s.join('')].length < 32) {
    // console.debug(`constructing...: ${s}`);
    const w = pick(model[s.at(-1) ?? ''] ?? {});
    if (w.length <= 0) {
      break;
    }
    s.push(w);
  }
  return s.join('');
};

const split = (text: string) => [...new Intl.Segmenter(new Intl.Locale('ja-JP'), { granularity: 'word' }).segment(text.normalize('NFC'))].map(({ segment }) => segment);

const acceptBeginning = (text: string) => [...text].length > 1 || !text.match(/[\p{Script=Hiragana}\p{Script=Katakana}\p{Punctuation}\p{Modifier_Letter}\p{Other_Symbol}]/u);

export const fromFile = (path: string) => {
  try {
    const { model, bos } = JSON.parse(readFileSync(path, 'utf8'));
    return {
      gen: () => talk(model, bos),
      reply: (comment: string) => {
        const words = [...new Intl.Segmenter(new Intl.Locale('ja-JP'), { granularity: 'word' }).segment(comment)].map(({ segment }) => segment);
        const cands = words.reduce<string[]>((prev, s) => {
          const a = [...s].length;
          const b = [...prev[0] ?? ''].length;
          // console.debug(s, a, b, [s], [...prev, s]);
          return a > b ? [s] : a === b ? [...prev, s] : prev;
        }, ['']);
        const topic = cands.at(Math.floor(Math.random() * cands.length));
        console.debug(`words: ${words}\ncands: ${cands}\ntopic: ${topic}`);
        return topic ? talk(model, [topic]) : '';
      },
      learn: (word: string) => {
        console.log(word);
        split(`${word}。`).reduce<string>((prev, next) => {
          if (prev) {
            model[prev] = {
              [next]: 0,
              ...model[prev] ?? {},
            };
            model[prev][next] += 1;
          } else {
            if (bos.includes(next)) {
              /* do nothing */
            } else if (acceptBeginning(next)) {
              bos.push(next);
            }
          }
          return next;
        }, '');
        try {
          writeFileSync(path, JSON.stringify({ model, bos }, null, 2));
        } catch (err) {
          console.warn(err);
        }
      },
      modifiedOn: () => statSync(path).mtimeMs,
    };
  } catch (err) {
    console.error(err);
    return;
  }
};

declare global {
  interface Math {
    /** @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sumPrecise */
    sumPrecise(args: number[]): number;
  }
}
