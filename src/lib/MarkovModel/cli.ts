import { promises as fs } from 'fs';
import path from 'path';
import type { MarkovModelData } from './MarkovModel';
import { generateSamples, inspectToken } from './MarkovModel';

function isWeightedCandidates(obj: any): obj is Record<string, number> {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  return Object.keys(obj).every(k => typeof k === 'string' && typeof obj[k] === 'number');
}

function isMarkovModelData(obj: any): obj is MarkovModelData {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  return Object.keys(obj).every(k => typeof k === 'string' && isWeightedCandidates(obj[k]));
}

export function normalizeRawModel(raw: any): MarkovModelData {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    if ('model' in raw) {
      if (!isMarkovModelData(raw.model)) throw new Error('Invalid model format: "model" is not a valid MarkovModelData');
      return raw.model as MarkovModelData;
    }
    if (isMarkovModelData(raw)) return raw as MarkovModelData;
    throw new Error('Invalid model format: expected MarkovModelData or { model: MarkovModelData }');
  }
  throw new Error('Invalid model format: expected an object');
}

export async function loadModelFromFile(filePath: string): Promise<MarkovModelData> {
  const resolved = path.resolve(process.cwd(), filePath);
  const txt = await fs.readFile(resolved, 'utf8');
  const raw = JSON.parse(txt);
  return normalizeRawModel(raw);
}

export async function writeModelToFile(filePath: string, model: MarkovModelData, opts: { backup?: boolean } = {}) {
  const resolved = path.resolve(process.cwd(), filePath);
  const { backup = true } = opts;
  if (backup) {
    const bak = `${resolved}.bak.${Date.now()}`;
    try {
      await fs.copyFile(resolved, bak);
    } catch (err: any) {
      // Ignore if file doesn't exist; rethrow other errors
      if (err?.code !== 'ENOENT') throw err;
    }
  }
  const content = { model };
  await fs.writeFile(resolved, JSON.stringify(content, null, 2), 'utf8');
}

