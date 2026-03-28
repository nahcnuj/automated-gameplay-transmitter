import { promises as fs } from 'fs';
import path from 'path';
import type { MarkovModelData } from './MarkovModel';
import { generateSamples, inspectToken } from './MarkovModel';

export type CLIOpts = {
  _rest: string[];
  file?: string;
  start?: string;
  n?: string;
  top?: string;
  commit: boolean;
  backup: boolean;
  help: boolean;
};

function isWeightedCandidates(obj: unknown): obj is Record<string, number> {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return false;
  const rec = obj as Record<string, unknown>;
  return Object.keys(rec).every(k => typeof k === 'string' && typeof rec[k] === 'number');
}

function isMarkovModelData(obj: unknown): obj is MarkovModelData {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return false;
  const rec = obj as Record<string, unknown>;
  return Object.keys(rec).every(k => typeof k === 'string' && isWeightedCandidates(rec[k]));
}

export function normalizeRawModel(raw: unknown): MarkovModelData {
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    const rec = raw as Record<string, unknown>;
    if ('model' in rec) {
      if (!isMarkovModelData(rec.model)) throw new Error('Invalid model format: "model" is not a valid MarkovModelData');
      return rec.model as MarkovModelData;
    }
    if (isMarkovModelData(rec)) return rec as MarkovModelData;
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


