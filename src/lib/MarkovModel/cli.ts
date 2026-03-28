import { promises as fs } from 'fs';
import path from 'path';
import { create } from './MarkovModel';

export type WeightedCandidates = Record<string, number>;
export type MarkovModelData = { '': WeightedCandidates; [k: string]: WeightedCandidates };
export type NormalizedModel = { model: MarkovModelData; corpus: string[]; shape: 'withCorpus'|'modelOnly'|'plain' };

if (!(Math as any).sumPrecise) {
  (Math as any).sumPrecise = (arr: number[]) => {
    let sum = 0;
    let c = 0;
    for (const v of arr) {
      const y = v - c;
      const t = sum + y;
      c = (t - sum) - y;
      sum = t;
    }
    return sum;
  };
}

export function normalizeRawModel(raw: any): NormalizedModel {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    if ('model' in raw && typeof raw.model === 'object') {
      const corpus = Array.isArray(raw.corpus) ? raw.corpus : [];
      return { model: raw.model as MarkovModelData, corpus, shape: raw.corpus ? 'withCorpus' : 'modelOnly' };
    }
    return { model: raw as MarkovModelData, corpus: [], shape: 'plain' };
  }
  return { model: { '': {} }, corpus: [], shape: 'plain' };
}

export async function loadModelFromFile(filePath: string): Promise<{ raw: any; normalized: NormalizedModel }> {
  const resolved = path.resolve(process.cwd(), filePath);
  const txt = await fs.readFile(resolved, 'utf8');
  const raw = JSON.parse(txt);
  return { raw, normalized: normalizeRawModel(raw) };
}

export async function writeModelToFile(filePath: string, normalized: NormalizedModel, opts: { backup?: boolean; preserveCorpus?: boolean } = {}) {
  const resolved = path.resolve(process.cwd(), filePath);
  const { backup = true, preserveCorpus = true } = opts;
  try {
    await fs.access(resolved);
    if (backup) {
      const bak = `${resolved}.bak.${Date.now()}`;
      await fs.copyFile(resolved, bak);
    }
  } catch {
    // file may not exist
  }
  const content = preserveCorpus ? { model: normalized.model, corpus: normalized.corpus } : { model: normalized.model };
  await fs.writeFile(resolved, JSON.stringify(content, null, 2), 'utf8');
}

export function inspectToken(model: MarkovModelData, token: string, topN = 10): Array<[string, number]> {
  const cands = model[token] ?? {};
  return Object.entries(cands).sort((a, b) => b[1] - a[1]).slice(0, topN) as Array<[string, number]>;
}

export function generateSamples(model: MarkovModelData, start = '', n = 1): string[] {
  const cloned = JSON.parse(JSON.stringify(model));
  const m = create(cloned);
  return Array.from({ length: n }, () => m.gen(start));
}

export function learnPreview(model: MarkovModelData, sentence: string) {
  const cloned = JSON.parse(JSON.stringify(model));
  const m = create(cloned, []);
  m.learn(sentence);
  const after = m.json.model;
  const corpus = m.json.corpus ?? [];
  const diffs: Record<string, Record<string, { before: number; after: number }>> = {};
  const keys = new Set<string>([...Object.keys(model), ...Object.keys(after)]);
  for (const k of keys) {
    const before = model[k] ?? {};
    const afterC = after[k] ?? {};
    const candKeys = new Set<string>([...Object.keys(before), ...Object.keys(afterC)]);
    for (const c of candKeys) {
      const b = before[c] ?? 0;
      const a = afterC[c] ?? 0;
      if (a !== b) {
        diffs[k] = diffs[k] ?? {};
        diffs[k][c] = { before: b, after: a };
      }
    }
  }
  return { diffs, newModel: after, corpus };
}
