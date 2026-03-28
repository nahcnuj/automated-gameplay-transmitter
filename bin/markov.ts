#!/usr/bin/env bun
import { loadModelFromFile } from '../src/lib/MarkovModel/cli.ts';
import { generateSamples, inspectToken } from '../src/lib/MarkovModel/MarkovModel.ts';

const argv = process.argv.slice(2);
const cmd = argv.shift();

function parseOpts(args: string[]) {
  const opts: Record<string, any> = {};
  while (args.length) {
    const a = args[0]!;
    if (a.startsWith('--')) {
      args.shift();
      const [k, v] = a.includes('=') ? a.slice(2).split('=') : [a.slice(2), undefined];
      if (v !== undefined) opts[k] = v;
      else {
        if (['file', 'start', 'n', 'top'].includes(k)) {
          opts[k] = args.shift();
        } else {
          opts[k] = true;
        }
      }
    } else break;
  }
  opts._rest = args;
  return opts;
}

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
