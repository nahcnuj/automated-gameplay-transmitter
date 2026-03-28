import { describe, it, expect } from 'bun:test';
import { normalizeRawModel } from './cli';
import { inspectToken, generateSamples } from './MarkovModel';

describe('Markov CLI helpers', () => {
  it('normalizes model and ignores corpus (model-only)', () => {
    const plain = { '': { a: 1 }, a: { '。': 1 } };
    const n1 = normalizeRawModel(plain);
    expect(n1).toEqual(plain);
    const wrapped = { model: plain, corpus: ['a。'] };
    const n2 = normalizeRawModel(wrapped as any);
    expect(n2).toEqual(plain);
  });

  it('inspectToken returns sorted candidates', () => {
    const model = { '': {}, tok: { x: 1, y: 5, z: 2 } };
    const top = inspectToken(model as any, 'tok', 2);
    expect(top[0]![0]).toBe('y');
    expect(top[1]![0]).toBe('z');
  });

  it('generateSamples produces expected count', () => {
    const model = { '': { hello: 1 }, hello: { '。': 1 } };
    const out = generateSamples(model as any, 'hello', 2);
    expect(out.length).toBe(2);
    expect(out[0]!.endsWith('。')).toBe(true);
  });
});
