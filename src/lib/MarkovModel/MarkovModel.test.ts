import { describe, expect, jest, test } from "bun:test";
import { choose, create } from "./MarkovModel";
import { splitIntoWords } from "../extensions/String";

const modelKeys = (model: ReturnType<typeof create>) => Object.keys(model.json.model);

describe('generate', () => {
  test('An empty model should always generate "。".', () => {
    const model = create();
    expect(model.gen()).toBe('。');
  });

  test('a no-branch model', () => {
    const model = create({
      '': { 'こ': 1 },
      'こ': { 'ん': 1 },
      'ん': { 'に': 1 },
      'に': { 'ち': 1 },
      'ち': { 'は': 1 },
      'は': { '。': 1 },
    });
    expect(model.gen()).toBe('こんにちは。');
  });

  test('gen with trace option should return nodes array', () => {
    const model = create({
      '': { 'こ': 1 },
      'こ': { 'ん': 1 },
      'ん': { 'に': 1 },
      'に': { 'ち': 1 },
      'ち': { 'は': 1 },
      'は': { '。': 1 },
    });
    const got = model.gen('', 1, { trace: true });
    expect(got).toEqual({ text: 'こんにちは。', nodes: ['こ', 'ん', 'に', 'ち', 'は', '。'] });
  });

  test('If "。" was picked once, the generation should stop.', () => {
    const model = create({
      '': { '。': 1 },
      '。': { '': 1 },
    });
    expect(model.gen()).toBe('。');
  });

  const times = 100;
  test('A model with some branches should choose one from them.', () => {
    const model = create({ '': { 'こん': 2 }, 'こん': { 'にちは': 1, 'ばんは': 1 }, 'にちは': { '。': 1 }, 'ばんは': { '。': 1 } });
    const counts = {
      'こんにちは。': 0,
      'こんばんは。': 0,
    };
    for (const i in [...new Array(times)]) {
      const rnd = Number.parseInt(i, 10) / times;
      jest.spyOn(global.Math, 'random').mockReturnValue(rnd);
      const got = model.gen() as 'こんにちは。' | 'こんばんは。';
      expect(got).toBeOneOf(['こんにちは。', 'こんばんは。']);
      counts[got]++;
    }
    expect(counts["こんにちは。"]).toBe(50);
    expect(counts["こんばんは。"]).toBe(50);
  });

  test('n-gram model should prefer longer context when n is specified at generation time', () => {
    const bosA = ['', 'A'].join('\0');
    const aB = ['A', 'B'].join('\0');
    const model = create({
      '': { 'A': 1 },
      'A': { 'X': 1 },
      [bosA]: { 'B': 1 },
      'B': { '。': 1 },
      [aB]: { '。': 1 },
      'X': { '。': 1 },
    });
    expect(model.gen('', 2)).toBe('AB。');
    expect(model.gen()).toBe('AX。');
  });

  test('n-gram model should fallback to shorter context when needed', () => {
    const model = create({
      '': { 'A': 1 },
      'A': { 'X': 1 },
      'X': { '。': 1 },
    });
    expect(model.gen('', 2)).toBe('AX。');
  });

  test('n-gram size can be specified when generating replies', () => {
    const fooA = ['foo', 'A'].join('\0');
    const model = create({
      'foo': { 'A': 1 },
      'A': { 'X': 1 },
      [fooA]: { '。': 1 },
      'X': { '。': 1 },
    });
    expect(model.reply('foo', 2)).toBe('fooA。');
    expect(model.reply('foo')).toBe('fooAX。');
  });
});

describe.each<[[string, number][], [number, string][]]>([
  [
    [
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ],
    [
      [0, 'a'],
      [0.5, 'a'],
      [1, 'b'],
      [1.5, 'b'],
      [2, 'b'],
      [3, 'c'],
      [5.9, 'c'],
      [6, 'c'],
    ],
  ],
])('choose a word from weighted candidates: %o', (cands: [string, number][], cases) => {
  test.each(cases)('w = %p -> %p', (w, want) => {
    expect(choose(cands, w)).toBe(want);
  });
});

describe('json', () => {
  test('empty model', () => {
    expect(create().json).toEqual({ model: { '': {} }, corpus: [] });
  });

  test('a simple model', () => {
    const model = {
      '': { 'こんにち': 1 },
      'こんにち': { 'は': 1 },
      'は': { '。': 1 }
    };
    expect(create(model).json).toEqual({ model, corpus: [] });
  });

  test('includes corpus', () => {
    expect(create(undefined, ['こんにちは。']).json).toEqual({ model: { '': {} }, corpus: ['こんにちは。'] });
  });

  test('learn with n-gram includes null-delimited keys', () => {
    const text = 'こんにちは。' as const;
    const model = create();
    model.learn(text);
    const words = text[splitIntoWords](new Intl.Locale('ja-JP'));
    expect(words).toEqual(['こんにちは', '。']);
    for (const key of ['', 'こんにちは', '\0こんにちは']) {
      expect(modelKeys(model)).toContain(key);
    }
  });

  test('toLearned should clone corpus', () => {
    const base = create();
    expect(base.json.corpus).toEqual([]);

    const model = base.toLearned('こんにちは。');
    expect(model.json.corpus).toEqual(['こんにちは。']);
  });

  test('learn should record 3-gram transitions from empty model', () => {
    const model = create();
    const before = new Set(modelKeys(model));
    model.learn('私は猫です。');
    const createdKeys = modelKeys(model).filter((k) => !before.has(k));
    const threeWordContextKeys = createdKeys.filter((k) => k.split('\0').length === 3);
    expect(threeWordContextKeys.length).toBeGreaterThan(0);
    expect(createdKeys).toContain(['私', 'は', '猫'].join('\0'));
    expect(threeWordContextKeys.some((k) => Object.keys(model.json.model[k]).length > 0)).toBe(true);
  });

  test('learn should honor maxLearnContext passed to create', () => {
    const model = create(undefined, [], 3);
    model.learn('私は猫です。');
    const contextKeys = modelKeys(model).filter((k) => k.length > 0);
    expect(contextKeys.every((k) => k.split('\0').length <= 3)).toBe(true);
  });

  test('JSON roundtrip should preserve null-delimited model keys', () => {
    const aB = ['A', 'B'].join('\0');
    const bosAB = ['', 'A', 'B'].join('\0');
    const sourceModel = {
      '': { 'A': 1 },
      [aB]: { 'C': 1 },
      [bosAB]: { '。': 1 },
    };
    const restoredModel = JSON.parse(JSON.stringify(sourceModel));
    expect(restoredModel).toEqual(sourceModel);
  });
});
