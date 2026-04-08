import { describe, expect, jest, test } from "bun:test";
import { choose, create } from "./MarkovModel";

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
});

describe('additional extra tests merged', () => {
  test('choose with empty candidates and negative threshold', () => {
    expect(choose([], 0)).toBe('');
    expect(choose([['a', 1]], -1)).toBe('');
  });

  test('learn updates model and corpus', () => {
    const m = create();
    m.learn('あい。');
    const json = m.json;
    expect(json.corpus).toContain('あい。');
    expect(json.model['']).toHaveProperty('あい', 1);
    expect(json.model['あい']).toHaveProperty('。', 1);
  });

  test('toLearned returns a new model and does not mutate original', () => {
    const m = create();
    const m2 = m.toLearned('おはよう。');
    expect(m.json.model['']).not.toHaveProperty('おはよう');
    expect(m2.json.model['']).toHaveProperty('おはよう');
  });

  test('reply returns undefined for empty input', () => {
    const m = create();
    expect(m.reply('')).toBeUndefined();
  });

  test('reply returns generated string when topic exists', () => {
    const model = {
      '': { topic: 1 },
      topic: { '。': 1 },
    } as any;
    const m = create(model);
    const resp = m.reply('topic');
    expect(resp).toBe('topic。');
  });

  test('learning skips single-character punctuation at beginning', () => {
    const m = create();
    m.learn('、こんにちは。');
    expect(Object.keys(m.json.model[''])).not.toContain('、');
  });

  test('gen stops by reaching max words length', () => {
    const model = {
      '': { a: 1 },
      a: { a: 1 },
    } as any;
    const m = create(model);
    const out = m.gen();
    expect(out.length).toBeGreaterThan(0);
  });

  test('learn increments existing counts when called repeatedly', () => {
    const m = create();
    m.learn('わん。');
    m.learn('わん。');
    const json = m.json;
    expect(json.model['']).toHaveProperty('わん', 2);
    expect(json.model['わん']).toHaveProperty('。', 2);
  });

  test('gen executes debug console when DEBUG_MARKOV enabled', () => {
    process.env.DEBUG_MARKOV = '1';
    const m = create();
    m.learn('デバッグ。');
    const out = m.gen('デバッグ');
    expect(typeof out).toBe('string');
    delete process.env.DEBUG_MARKOV;
  });
});
