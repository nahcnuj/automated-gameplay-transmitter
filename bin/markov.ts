#!/usr/bin/env bun
import { loadModelFromFile } from '../src/lib/MarkovModel/cli.ts';
import { generateSamples, inspectToken } from '../src/lib/MarkovModel/MarkovModel.ts';
import { parseArgs } from 'util';

let cmd: string | undefined;
let opts: Record<string, any> = {};

function printUsage() {
  console.log('Usage: markov <inspect|generate> [options]');
  console.log('Commands:');
  console.log('  inspect <word>        Show top candidate continuations for <word>');
  console.log('  generate              Generate sentences from the model');
  console.log('Options:');
  console.log('  --file <path>         Model file (default ./var/model.json)');
  console.log('  --start <token>       Start token for generate');
  console.log('  --n <num>             Number of samples to generate');
  console.log('  --top <num>           Top N candidates for inspect');
  console.log('  --commit              (noop in generate/inspect)');
  console.log('  --backup              (noop in generate/inspect)');
}

try {
  const { values: optsValues, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      file: { type: 'string' },
      start: { type: 'string' },
      n: { type: 'string' },
      top: { type: 'string' },
      commit: { type: 'boolean' },
      backup: { type: 'boolean' },
      help: { type: 'boolean' },
      h: { type: 'boolean' },
    },
    allowPositionals: true,
    strict: true,
  });
  cmd = positionals[0];
  opts = { ...optsValues } as Record<string, any>;
  opts._rest = positionals.slice(1);
  if (opts.help || opts.h) {
    printUsage();
    process.exit(0);
  }
  if (!cmd) {
    printUsage();
    process.exit(1);
  }
} catch (err: any) {
  console.error('Argument parse error:', err?.message ?? String(err));
  console.error('Use --help for usage.');
  process.exit(2);
}

(async () => {
  const file = opts.file ?? './var/model.json';
  if (cmd === 'inspect') {
    const word = opts._rest[0];
    if (!word) { console.error('inspect <word>'); process.exit(1); }
    const model = await loadModelFromFile(file);
    const rows = inspectToken(model, word, Number(opts.top ?? 10));
    console.log(`Top ${rows.length} for word: ${word}`);
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
