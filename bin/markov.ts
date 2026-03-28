#!/usr/bin/env bun
import { loadModelFromFile } from '../src/lib/MarkovModel/cli.ts';
import { generateSamples, inspectToken } from '../src/lib/MarkovModel/MarkovModel.ts';

const argv = process.argv.slice(2);
const cmd = argv.shift();

// Use Bun's built-in parser (no polyfill). Requires running under Bun.
const parsed = Bun.parseArgs(process.argv.slice(2), {
  string: ['file', 'start', 'n', 'top'],
  boolean: ['commit', 'backup'],
});
const opts = { ...parsed } as Record<string, any>;
opts._rest = parsed._ ?? [];

if (!cmd) {
  console.log('Usage: markov <inspect|generate> [options]');
  process.exit(1);
}

(async () => {
  const opts = parseOpts(argv);
  const file = opts.file ?? './var/model.json';
  if (cmd === 'inspect') {
    const token = opts._rest[0];
    if (!token) { console.error('inspect <token>'); process.exit(1); }
    const model = await loadModelFromFile(file);
    const rows = inspectToken(model, token, Number(opts.top ?? 10));
    console.log(`Top ${rows.length} for token: ${token}`);
    for (const [cand, weight] of rows) console.log(`${cand}\t${weight}`);
    return;
  }
  if (cmd === 'generate') {
    const n = Number(opts.n ?? 1);
    const start = opts.start ?? '';
    const model = await loadModelFromFile(file);
    const out = generateSamples(model, start, n);
    out.forEach((s, i) => console.log(`${i + 1}: ${s}`));
    return;
  }

  console.error('Unknown command', cmd);
  process.exit(1);
})();
