#!/usr/bin/env bun
import { loadModelFromFile, type CLIOpts, parseAndGetCommand } from '../src/lib/MarkovModel/cli.ts';
import { generateSamples, inspectToken } from '../src/lib/MarkovModel/MarkovModel.ts';

const { cmd, opts } = parseAndGetCommand(process.argv.slice(2));

(async () => {
  const file = opts.file ?? './var/model.json';
  if (cmd === 'inspect') {
    const word = opts._rest?.[0];
    if (!word) { console.error('inspect <word>'); process.exit(1); }
    const model = await loadModelFromFile(file);
    const rows = inspectToken(model, word, Number(opts.top ?? '10'));
    console.log(`Top ${rows.length} for word: ${word}`);
    for (const [cand, weight] of rows) console.log(`${cand}\t${weight}`);
    return;
  }
  if (cmd === 'generate') {
    const n = Number(opts.n ?? '1');
    const start = opts.start ?? '';
    const model = await loadModelFromFile(file);
    const out = generateSamples(model, start, n);
    out.forEach((s, i) => console.log(`${i + 1}: ${s}`));
    return;
  }

  console.error('Unknown command', cmd);
  process.exit(1);
})();
