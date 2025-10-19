import { describe, expect, jest, test } from "bun:test";
import { choose, create } from "./MarkovModel";

describe('generate', () => {
  test('An empty model should generate "。".', () => {
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
    expect(create().json).toEqual({ model: { '': {} } });
  });

  test('a simple model', () => {
    const model = {
      '': { 'こんにち': 1 },
      'こんにち': { 'は': 1 },
      'は': { '。': 1 }
    };
    expect(create(model).json).toEqual({ model });
  });
});