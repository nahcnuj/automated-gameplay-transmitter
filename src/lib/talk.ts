import { readFileSync, writeFileSync } from "node:fs";

type Model = {
  [word: string]: {
    [next: string]: number
  }
};

const pick = (cands: { [k: string]: number }) => {
  const total = Object.values(cands).reduce((s, v) => s + v, 0);
  const rnd = Math.floor(Math.random() * total);
  const [next,]: [string, number] = Object.entries(cands).reduce(([w, s], [word, weight]) => {
    if (s > rnd) {
      return [w, s];
    }
    return [word, s + weight];
  }, ["", 0]);
  return next;
};

export const talk = (model: Model, bos = ['こ']) => {
  let s = [bos[Math.floor(Math.random() * bos.length)] ?? '。'];
  while (s.at(-1) !== '。' && s.length < 30) {
    const w = pick(model[s.at(-1) ?? ''] ?? {});
    s.push(w);
  }
  return s.join('');
};

export const fromFile = (path: string) => {
  try {
    const { model, bos } = JSON.parse(readFileSync(path, 'utf8'));
    return {
      gen: () => talk(model, bos),
      add: (word: string) => {
        console.log(word);
        Array.from(`${word}。`).reduce<string>((prev, next) => {
          if (prev) {
            const v = model[prev] ?? { [next]: 0 };
            v[next] += 1;
            model[prev] = v;
          } else {
            if (!bos.includes(next)) {
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
    };
  } catch (err) {
    return;
  }
};
