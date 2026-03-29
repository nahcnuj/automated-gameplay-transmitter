import { sliceByNumber } from "../extensions/Array";
import { splitIntoWords } from "../extensions/String";
import { z } from 'zod';

export type WeightedCandidates = Record<string, number>;

export type MarkovModelData = {
  /** initial word candidates */
  '': WeightedCandidates

  [k: string]: WeightedCandidates
};

/**
 * Selects a candidate string from a list of weighted candidates by scanning
 * cumulative weights and returning the candidate whose weight push the
 * cumulative sum strictly above the provided threshold `w`.
 *
 * @param cands Array of pairs [label, weight]. Each element is a tuple
 *              where the first item is the candidate string and the
 *              second is its numeric weight.
 * @param w     Threshold used to pick a candidate from the cumulative
 *              weight distribution. Intended to be in the range
 *              [0, totalWeight), where totalWeight is the sum of all
 *              weights in `cands`.
 *
 * @returns The selected candidate string.
 *          - If `cands` is empty the function returns the empty string.
 *          - If `w` is negative the function returns the empty string (no
 *            candidate is selected).
 *          - If `w` is greater than or equal to the sum of all weights the
 *            function returns the last candidate's label.
 *
 * @remarks
 * - The function does not validate inputs: weights are expected to be
 *   non‑negative numbers and `w` is expected to be a finite number.
 *   Supplying negative weights or non‑finite values may produce
 *   unintuitive results.
 * - Time complexity: O(n), where n is `cands.length`.
 *
 * @example
 * Given candidates [['a', 1], ['b', 2], ['c', 3]]
 * cumulative weights: 1, 3, 6
 * - w = 0.5  -> 'a' (0.5 < 1)
 * - w = 1.5  -> 'b' (1.5 < 3 = 1+2)
 * - w = 5.9  -> 'c' (5.9 < 6 = 1+2+3)
 * - w >= 6.0 -> 'c' ( w >= 6 = 1+2+3)
 */
export const choose = (cands: [string, number][], w: number): string => cands.reduce(([current, acc], [next, weight]) => {
  if (acc > w) {
    return [current, acc];
  }
  return [next, acc + weight];
}, ['', 0])[0];

declare global {
  interface Math {
    /** @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sumPrecise */
    sumPrecise(args: number[]): number;
  }
}

export function sumPreciseImpl(arr: number[]) {
  let sum = 0;
  let c = 0;
  for (const v of arr) {
    const y = v - c;
    const t = sum + y;
    c = (t - sum) - y;
    sum = t;
  }
  return sum;
}

Math.sumPrecise = sumPreciseImpl;
const pick = (cands: WeightedCandidates) => {
  const total = Math.sumPrecise(Object.values(cands));
  const rnd = Math.floor(Math.random() * total);
  return choose(Object.entries(cands), rnd);
};

export function formatDebugWords(words: string[]) {
  return words[sliceByNumber](7).flatMap((ss, i) => i ? [' ', ...ss] : ss).join('/');
}

const isDebug = () => Boolean(process.env.DEBUG_MARKOV);

const acceptBeginning = (text: string) => [...text].length > 1 || !text.match(/[\p{Script=Hiragana}\p{Script=Katakana}\p{Punctuation}\p{Modifier_Letter}\p{Other_Symbol}]/u);

const jaJP = new Intl.Locale('ja-JP');

/**
 * Create a word-level Markov chain model.
 * The model provides some helper methods to generate something to talk or replies and learn new sentences.
 * When learned a new sentence, the model is modified itself and writes the modified model out to the given file.
 * 
 * Splitting into words depends on `Intl.Segmenter` and assumes that a sentence written in Japanese.
 *
 * @example
 * const model = create();
 * 
 * model.learn('こんにちは。');
 * console.log(JSON.stringify(model.json, null, 2));
 * 
 * const reply = model.reply('元気ですか？');
 * console.log(reply);
 */
export const create = (model: MarkovModelData = { '': {} }, corpus: string[] = []) => ({
  gen: (bos = ''): string => {
    const words: string[] = [bos];
    while (words.at(-1) !== '。' && words.length < 15 && [...words.join('')].length < 32) {
      // console.debug('[DEBUG]', s.at(-1), ...Object.entries(model[s.at(-1) ?? ''] ?? {}).toSorted(([, a], [, b]) => b - a).slice(0, 3));
      const w = pick(model[words.at(-1) ?? ''] ?? {});
      if (w.length <= 0) {
        words.push('。');
        break;
      }
      words.push(w);
    }
    if (isDebug()) console.debug('[DEBUG]',
      [...words].length - 1, 'words',
      [...words.join('')].length - 1, 'charas',
      formatDebugWords(words),
    );
    return words.join('');
  },
  reply(text: string): string | undefined {
    const words = text[splitIntoWords](jaJP);
    const cands = words.reduce<string[]>((prev, s) => {
      const a = [...s].length;
      const b = [...prev[0] ?? ''].length;
      // console.debug(s, a, b, [s], [...prev, s]);
      return a > b ? [s] : a === b ? [...prev, s] : prev;
    }, ['']);
    const topic = cands.at(Math.floor(Math.random() * cands.length));
    if (topic) {
      if (isDebug()) console.debug(`words: ${words}\ncands: ${cands}\ntopic: ${topic}`);
      return this.gen(topic);
    }
  },
  learn: (text: `${string}。`): void => {
    corpus.push(text);
    if (isDebug()) console.debug('[DEBUG]', 'learn', text);
    text[splitIntoWords](jaJP).reduce<string>((prev, next) => {
      if (prev === '' && !acceptBeginning(next)) {
        // skip
        return next;
      }
      if (isDebug()) console.debug('[DEBUG]', prev, next);
      model[prev] = {
        [next]: 0,
        ...(model[prev] ?? {}),
      };
      model[prev][next] = (model[prev][next] ?? 0) + 1;
      return next;
    }, '');
  },
  toLearned: (text: `${string}。`) => {
    const m = create(structuredClone(model));
    m.learn(text);
    return m;
  },
  get json() {
    return { model, corpus };
  },
});

export type MarkovModel = ReturnType<typeof create>;

/**
 * Inspect a word's top candidates sorted by weight.
 */
export function inspectWord(model: MarkovModelData, word: string, topN = 10): Array<[string, number]> {
  const cands = model[word] ?? {};
  return Object.entries(cands).sort((a, b) => b[1] - a[1]).slice(0, topN) as Array<[string, number]>;
}

/**
 * Generate `n` samples from a raw model using the existing `create` generator.
 */
export function generateSamples(model: MarkovModelData, start = '', n = 1): string[] {
  const cloned = JSON.parse(JSON.stringify(model));
  const m = create(cloned);
  return Array.from({ length: n }, () => m.gen(start));
}

/**
 * Parse and validate a model file object previously produced by `JSON.parse`.
 * Ensures the object has a `model` property (MarkovModelData) and an
 * optional `corpus` array of strings. The `model` is required to contain
 * the empty-string start key `` ''.
 */
export function parseModelFile(fileContents: unknown): { model: MarkovModelData; corpus?: string[] } {
  const weightedCandidatesSchema = z.record(z.number());
  const markovModelDataSchema = z
    .record(weightedCandidatesSchema)
    .refine((m) => Object.prototype.hasOwnProperty.call(m, ''), {
      message: "Model must contain empty-string start key ''",
    });

  const schema = z.object({
    model: markovModelDataSchema,
    corpus: z.array(z.string()).optional(),
  });

  const parsed = schema.parse(fileContents);
  return parsed as { model: MarkovModelData; corpus?: string[] };
}
