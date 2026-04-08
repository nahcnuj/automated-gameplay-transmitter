import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const bunCmd = process.platform === 'win32' ? 'bun.exe' : 'bun';
const binScript = path.resolve('bin', 'markov.ts');

async function runMarkov(args: string[]) {
  return new Promise<{ stdout: string; stderr: string; code: number | null }>((resolve, reject) => {
    const child = spawn(bunCmd, [binScript, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    if (!child.stdout || !child.stderr) {
      reject(new Error('Missing stdout/stderr from child process'));
      return;
    }
    child.stdout.on('data', (c) => { out += String(c); });
    child.stderr.on('data', (c) => { err += String(c); });
    child.on('error', (e) => reject(e));
    child.on('exit', (code) => resolve({ stdout: out, stderr: err, code }));
  });
}

describe('Markov CLI E2E', () => {
  beforeEach(async () => {
    await fs.mkdir(path.resolve('var'), { recursive: true });
  });

  afterEach(async () => {
    try {
      const files = await fs.readdir(path.resolve('var'));
      for (const f of files) {
        if (f.startsWith('test-model') || f.startsWith('test-model-commit')) {
          try { await fs.unlink(path.join('var', f)); } catch {}
        }
        if (f.includes('model.moderated') || f.includes('moderation_report') || f.includes('restored')) {
          try { await fs.unlink(path.join('var', f)); } catch {}
        }
      }
    } catch {}
  });

  it('inspect and generate run using a temp model file', async () => {
    const model = { '': {}, hello: { '。': 1, world: 2 }, world: { '。': 1 } };
    const fp = path.resolve('var', 'test-model.json');
    await fs.writeFile(fp, JSON.stringify({ model }), 'utf8');
    const inspectRes = await runMarkov(['inspect', 'hello', '--file', fp, '--top', '2']);
    expect(inspectRes.stdout.includes('Top')).toBe(true);
    const genRes = await runMarkov(['generate', '--file', fp, '--n', '2']);
    expect(/^[\s\S]*1: /m.test(genRes.stdout)).toBe(true);
  });

  it('--help with subcommand exits 0', async () => {
    const res = await runMarkov(['inspect', '--help']);
    expect(res.code).toBe(0);
    expect(res.stdout.includes('Usage: markov inspect')).toBe(true);
  });

  it('positional help exits 0', async () => {
    const res = await runMarkov(['help', 'generate']);
    expect(res.code).toBe(0);
    expect(res.stdout.includes('Usage: markov generate')).toBe(true);
  });

  it('no command provided exits 1', async () => {
    const res = await runMarkov([]);
    expect(res.code).toBe(1);
  });

  it('inspect missing argument exits 1 and prints error', async () => {
    const res = await runMarkov(['inspect']);
    expect(res.code).toBe(1);
    expect(res.stderr.includes('inspect <word>')).toBe(true);
  });

  it('unknown flags exit 2 (parse error)', async () => {
    const res = await runMarkov(['--not-a-flag']);
    expect(res.code).toBe(2);
  });

  it('--help (global) prints usage and exits 0', async () => {
    const res = await runMarkov(['--help']);
    expect(res.code).toBe(0);
    expect(res.stdout.includes('Usage: markov')).toBe(true);
  });

  it('unknown command triggers exit 1', async () => {
    const res = await runMarkov(['unknowncmd']);
    expect(res.code).toBe(1);
    expect(res.stderr.includes('Unknown command')).toBe(true);
  });

  it('--help with generate subcommand exits 0', async () => {
    const res = await runMarkov(['generate', '--help']);
    expect(res.code).toBe(0);
    expect(res.stdout.includes('Usage: markov generate')).toBe(true);
  });

  it('unknown command with --help prints fallback and exits 0', async () => {
    const res = await runMarkov(['unknowncmd', '--help']);
    expect(res.code).toBe(0);
    expect(res.stdout.includes('No help available for unknown command')).toBe(true);
  });

  it('help inspect exits 0 and prints inspect usage', async () => {
    const res = await runMarkov(['help', 'inspect']);
    expect(res.code).toBe(0);
    expect(res.stdout.includes('Usage: markov inspect')).toBe(true);
  });

  it('help unknown prints fallback and exits 0', async () => {
    const res = await runMarkov(['help', 'idontexist']);
    expect(res.code).toBe(0);
    expect(res.stdout.includes('No help available for unknown command')).toBe(true);
  });

  it('generate --commit creates a backup and writes the model file', async () => {
    const model = { '': {}, hello: { '。': 1 } };
    const fp = path.resolve('var', 'test-model-commit.json');
    await fs.writeFile(fp, JSON.stringify({ model }), 'utf8');
    const res = await runMarkov(['generate', '--file', fp, '--n', '1', '--commit']);
    expect(res.code === 0 || res.code === 0).toBe(true);
    const files = await fs.readdir(path.dirname(fp));
    const base = path.basename(fp);
    const bakExists = files.some(f => f.startsWith(base + '.bak.'));
    expect(bakExists).toBe(true);
    const txt = await fs.readFile(fp, 'utf8');
    const parsed = JSON.parse(txt);
    expect(parsed.model).toBeTruthy();
  });

  it('generate --commit reports error and exits 1 when write fails', async () => {
    const fp = path.resolve('var', 'test-model-commit-fail.json');
    try {
      await fs.mkdir(fp, { recursive: true });
    } catch {}
    const res = await runMarkov(['generate', '--file', fp, '--n', '1', '--commit']);
    expect(res.code).toBe(1);
    expect(res.stderr.includes('Failed to write model file:') || res.stderr.length > 0).toBe(true);
  });
});
