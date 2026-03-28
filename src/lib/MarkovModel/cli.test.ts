import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { normalizeRawModel, runCli, printUsage, printSubcommandHelp } from './cli';
import { inspectToken, generateSamples } from './MarkovModel';
import type { MarkovModelData } from './MarkovModel';
import { promises as fs } from 'fs';
import path from 'path';

describe('Markov CLI helpers', () => {
  it('normalizes model and ignores corpus (model-only)', () => {
    const plain = { '': { a: 1 }, a: { '。': 1 } };
    const n1 = normalizeRawModel(plain);
    expect(n1).toEqual(plain);
    const wrapped = { model: plain, corpus: ['a。'] };
    const n2 = normalizeRawModel(wrapped as unknown);
    expect(n2).toEqual(plain);
  });

  it('inspectToken returns sorted candidates', () => {
    const model: MarkovModelData = { '': {}, tok: { x: 1, y: 5, z: 2 } };
    const top = inspectToken(model, 'tok', 2);
    expect(top[0]![0]).toBe('y');
    expect(top[1]![0]).toBe('z');
  });

  it('generateSamples produces expected count', () => {
    const model: MarkovModelData = { '': { hello: 1 }, hello: { '。': 1 } };
    const out = generateSamples(model, 'hello', 2);
    expect(out.length).toBe(2);
    expect(out[0]!.endsWith('。')).toBe(true);
  });

  it('printUsage and printSubcommandHelp produce output', () => {
    const logs: string[] = [];
    const orig = console.log;
    (console as any).log = (...args: any[]) => { logs.push(args.join(' ')); };
    try {
      printUsage();
      printSubcommandHelp('inspect');
      printSubcommandHelp('generate');
      printSubcommandHelp('unknown-cmd');
    } finally {
      console.log = orig;
    }
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.some(l => l.includes('Usage: markov'))).toBe(true);
  });

  it('runCli shows subcommand help with --help and exits', async () => {
    const origExit = process.exit;
    const origLog = console.log;
    const logs: string[] = [];
    (console as any).log = (...a: any[]) => { logs.push(a.join(' ')); };
    let code: number | undefined;
    (process as any).exit = (c = 0) => { code = c; throw new Error('process.exit:' + c); };
    try {
      try {
        await runCli(['inspect', '--help']);
        throw new Error('should have exited');
      } catch (err: any) {
        expect(String(err.message)).toContain('process.exit:0');
      }
    } finally {
      (process as any).exit = origExit;
      (console as any).log = origLog;
    }
    expect(code).toBe(0);
    expect(logs.some(l => l.includes('Usage: markov inspect'))).toBe(true);
  });

  it('runCli inspect and generate execute using a temp model file', async () => {
    const model: MarkovModelData = { '': {}, hello: { '。': 1, world: 2 }, world: { '。': 1 } };
    const fp = path.resolve('var', 'test-model.json');
    await fs.mkdir(path.dirname(fp), { recursive: true });
    await fs.writeFile(fp, JSON.stringify(model), 'utf8');
    const out: string[] = [];
    const origLog = console.log;
    (console as any).log = (...a: any[]) => { out.push(a.join(' ')); };
    try {
      await runCli(['inspect', 'hello', '--file', fp, '--top', '2']);
      expect(out.some(l => l.includes('Top'))).toBe(true);
      out.length = 0;
      await runCli(['generate', '--file', fp, '--n', '2']);
      expect(out.some(l => l.match(/^1:\s/))).toBe(true);
    } finally {
      (console as any).log = origLog;
      await fs.unlink(fp).catch(() => {});
    }
  });
});
