import { describe, expect, jest, test } from 'bun:test';
import { choose, create } from './MarkovModel';
import { sumPreciseImpl, formatDebugWords } from './MarkovModel';

describe('choose and Math.sumPrecise edge cases', () => {
  test('choose with empty candidates and negative threshold', () => {
    expect(choose([], 0)).toBe('');
    expect(choose([['a', 1]], -1)).toBe('');
  });

  test('Math.sumPrecise agrees with simple sum (toBeCloseTo)', () => {
    const arr = [0.1, 0.2, 0.3];
    const s = arr.reduce((a, b) => a + b, 0);
    expect(sumPreciseImpl(arr)).toBeCloseTo(s);
  });
});

describe('learning, toLearned and reply behaviors', () => {
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
    jest.spyOn(global.Math, 'random').mockReturnValue(0);
    expect(m.reply('')).toBeUndefined();
  });

  test('reply returns generated string when topic exists', () => {
    const model = {
      '': { topic: 1 },
      topic: { '。': 1 },
    } as any;
    const m = create(model);
    jest.spyOn(global.Math, 'random').mockReturnValue(0);
    const resp = m.reply('topic');
    expect(resp).toBe('topic。');
  });

  test('learning skips single-character punctuation at beginning', () => {
    const m = create();
    m.learn('、こんにちは。');
    // model[''] should not include the single punctuation token as beginning
    expect(Object.keys(m.json.model[''])).not.toContain('、');
  });
});

describe('additional generation and learning branches', () => {
  test('gen stops by reaching max words length', () => {
    // create a model that loops forever on 'あ'
    const model = {
      '': { a: 1 },
      a: { a: 1 },
    } as any;
    const m = create(model);
    jest.spyOn(global.Math, 'random').mockReturnValue(0);
    const out = m.gen();
    // should be a sequence of 'a's (no '。') but join returns something
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

  test('generateSamples with start token and n>1', () => {
    const model = { '': { x: 1 }, x: { '。': 1 } } as any;
    const out = require('./MarkovModel').generateSamples(model, 'x', 3);
    expect(out.length).toBe(3);
    expect(out.every((s: string) => s.endsWith('。'))).toBe(true);
  });
});

describe('test exported helpers', () => {
  test('sumPreciseImpl works on varied inputs', () => {
    expect(sumPreciseImpl([1, 2, 3])).toBe(6);
    expect(sumPreciseImpl([0.1, 0.2, 0.3])).toBeCloseTo(0.6);
  });

  test('formatDebugWords uses sliceByNumber extension', () => {
    const words = ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く'];
    const out = formatDebugWords(words as string[]);
    expect(typeof out).toBe('string');
  });
  
  test('gen executes debug console when DEBUG_MARKOV enabled', () => {
    process.env.DEBUG_MARKOV = '1';
    const m = create();
    m.learn('デバッグ。');
    jest.spyOn(global.Math, 'random').mockReturnValue(0);
    const out = m.gen('デバッグ');
    expect(typeof out).toBe('string');
    delete process.env.DEBUG_MARKOV;
  });
});
