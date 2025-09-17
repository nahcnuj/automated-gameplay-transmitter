import { readFileSync, writeFileSync } from "node:fs";

type Model = {
  [word: string]: {
    [next: string]: number
  }
};

const start = ["こ"];
const eos = ["。"];

const chains: Model = {
  "こ": {
    "ん": 1,
  },
  "ん": {
    "に": 1,
  },
  "に": {
    "ち": 1,
  },
  "ち": {
    "わ": 1,
  },
  "わ": {
    "。": 1,
  },
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
  console.log(model);
  let s = [bos[Math.floor(Math.random() * bos.length)] ?? "。"];
  while (s.at(-1) !== '。' && s.length < 50) {
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
        Array.from(`${word}。`).reduce<string>((prev, next) => {
          if (prev) {
            const v = model[prev] ??= { [next]: 0 };
            v[next] += 1;
            console.log(model);
          } else {
            if (!bos.includes(next)) {
              bos.push(next);
              console.log(bos);
            }
          }
          return next;
        }, '');
        try {
          writeFileSync(path, JSON.stringify({ model, bos }));
        } catch (err) {
          console.warn(err);
        }
      },
    };
  } catch (err) {
    return;
  }
};
