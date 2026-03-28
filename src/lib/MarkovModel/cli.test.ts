import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { parseMarkovModelData, runCli, printUsage, printSubcommandHelp } from './cli';
import { inspectToken, generateSamples } from './MarkovModel';
import type { MarkovModelData } from './MarkovModel';
import { promises as fs } from 'fs';
import path from 'path';

describe('Markov CLI helpers', () => {
  it('normalizes model and ignores corpus (model-only)', () => {
    const plain = { '': { a: 1 }, a: { '。': 1 } };
    const n1 = parseMarkovModelData({ model: plain });
    expect(n1).toEqual(plain);
    const wrapped = { model: plain, corpus: ['a。'] };
    const n2 = parseMarkovModelData(wrapped);
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

  // Note: we avoid calling `runCli` for branches that call `process.exit` because
  // that will terminate the test process. `printSubcommandHelp` and `printUsage`
  // are tested above to cover help output.

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

  it('runCli exits with code 0 when using --help with subcommand', async () => {
    const origExit = (process as any).exit;
    const origLog = (console as any).log;
    const logs: string[] = [];
    (console as any).log = (...a: any[]) => { logs.push(a.join(' ')); };
    (process as any).exit = (c = 0) => { throw new Error('EXIT:' + c); };
    try {
      await runCli(['inspect', '--help']);
      throw new Error('expected exit');
    } catch (err: any) {
      expect(String(err.message)).toContain('EXIT:0');
    } finally {
      (process as any).exit = origExit;
      (console as any).log = origLog;
    }
    expect(logs.some(l => l.includes('Usage: markov inspect'))).toBe(true);
  });

  it('runCli exits with code 0 for positional help', async () => {
    const origExit = (process as any).exit;
    const origLog = (console as any).log;
    const logs: string[] = [];
    (console as any).log = (...a: any[]) => { logs.push(a.join(' ')); };
    (process as any).exit = (c = 0) => { throw new Error('EXIT:' + c); };
    try {
      await runCli(['help', 'generate']);
      throw new Error('expected exit');
    } catch (err: any) {
      expect(String(err.message)).toContain('EXIT:0');
    } finally {
      (process as any).exit = origExit;
      (console as any).log = origLog;
    }
    expect(logs.some(l => l.includes('Usage: markov generate'))).toBe(true);
  });

  it('runCli exits with code 1 when no command provided', async () => {
    const origExit = (process as any).exit;
    (process as any).exit = (c = 0) => { throw new Error('EXIT:' + c); };
    try {
      await runCli([]);
      throw new Error('expected exit');
    } catch (err: any) {
      expect(String(err.message)).toContain('EXIT:1');
    } finally {
      (process as any).exit = origExit;
    }
  });

  it('runCli exits with code 1 when inspect missing argument', async () => {
    const origExit = (process as any).exit;
    const origErr = (console as any).error;
    const errs: string[] = [];
    (console as any).error = (...a: any[]) => { errs.push(a.join(' ')); };
    (process as any).exit = (c = 0) => { throw new Error('EXIT:' + c); };
    try {
      await runCli(['inspect']);
      throw new Error('expected exit');
    } catch (err: any) {
      expect(String(err.message)).toContain('EXIT:1');
    } finally {
      (process as any).exit = origExit;
      (console as any).error = origErr;
    }
    expect(errs.some(e => e.includes('inspect <word>'))).toBe(true);
  });

  it('runCli signals parse error (exit 2) for unknown flags', async () => {
    const origExit = (process as any).exit;
    (process as any).exit = (c = 0) => { throw new Error('EXIT:' + c); };
    try {
      await runCli(['--not-a-flag']);
      throw new Error('expected exit');
    } catch (err: any) {
      expect(String(err.message)).toContain('EXIT:2');
    } finally {
      (process as any).exit = origExit;
    }
  });

  it('parseMarkovModelData throws for invalid inputs', () => {
    expect(() => parseMarkovModelData({ model: null })).toThrow();
    const bad = { model: { a: { x: 'nope' } } };
    expect(() => parseMarkovModelData(bad)).toThrow('Invalid model format');
  });

  it('parseMarkovModelData throws when token candidates are not objects', () => {
    expect(() => parseMarkovModelData({ model: { a: [] } })).toThrow('Invalid model format');
  });

  it('runCli --help (global) prints usage and exits 0', async () => {
    const origExit = (process as any).exit;
    const origLog = (console as any).log;
    const logs: string[] = [];
    (console as any).log = (...a: any[]) => { logs.push(a.join(' ')); };
    (process as any).exit = (c = 0) => { throw new Error('EXIT:' + c); };
    try {
      await runCli(['--help']);
      throw new Error('expected exit');
    } catch (err: any) {
      expect(String(err.message)).toContain('EXIT:0');
    } finally {
      (process as any).exit = origExit;
      (console as any).log = origLog;
    }
    expect(logs.some(l => l.includes('Usage: markov'))).toBe(true);
  });

  it('runCli unknown command triggers exit 1', async () => {
    const origExit = (process as any).exit;
    const origErr = (console as any).error;
    let errMsg = '';
    (console as any).error = (...a: any[]) => { errMsg = a.join(' '); };
    (process as any).exit = (c = 0) => { throw new Error('EXIT:' + c); };
    try {
      await runCli(['unknowncmd']);
      throw new Error('expected exit');
    } catch (err: any) {
      expect(String(err.message)).toContain('EXIT:1');
    } finally {
      (process as any).exit = origExit;
      (console as any).error = origErr;
    }
    expect(errMsg).toContain('Unknown command');
  });
});
