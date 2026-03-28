import { promises as fs } from 'fs';
import path from 'path';
import { parseArgs } from 'util';
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

export function printUsage() {
  console.log('Usage: markov <inspect|generate> [options]');
  console.log('Commands:');
  console.log('  inspect <word>        Show top candidate continuations for <word>');
  console.log('  generate              Generate sentences from the model');
  console.log('  help                  Show usage');
  console.log('Options:');
  console.log('  --file <path>         Model file (default ./var/model.json)');
  console.log('  --start <token>       Start token for generate');
  console.log('  --n <num>             Number of samples to generate');
  console.log('  --top <num>           Top N candidates for inspect');
  console.log('  --commit              Commit learned changes to the model file (learn only)');
  console.log('  --backup              Create a backup when committing changes');
}

export function printSubcommandHelp(command: string) {
  switch (command) {
    case 'inspect':
      console.log('Usage: markov inspect <word> [--top <num>] [--file <path>]');
      console.log('Show top candidate continuations for <word>.');
      console.log('Options:');
      console.log('  --top <num>    Number of top candidates to show (default 10)');
      console.log('  --file <path>  Model file (default ./var/model.json)');
      return;
    case 'generate':
      console.log('Usage: markov generate [--n <num>] [--start <token>] [--file <path>]');
      console.log('Generate sentences from the model.');
      console.log('Options:');
      console.log('  --n <num>      Number of samples to generate (default 1)');
      console.log('  --start <tok>  Start token for generation');
      console.log('  --file <path>  Model file (default ./var/model.json)');
      return;
    default:
      console.log(`No help available for unknown command: ${command}`);
      printUsage();
  }
}

export async function runCli(argv: string[]) {
  try {
    const { values: optsValues, positionals } = parseArgs({
      args: argv,
      options: {
        file: { type: 'string' },
        start: { type: 'string' },
        n: { type: 'string' },
        top: { type: 'string' },
        commit: { type: 'boolean' },
        backup: { type: 'boolean' },
        help: { type: 'boolean' },
      },
      allowPositionals: true,
      strict: true,
    }
  } catch (err: any) {
    const [cmdLocal, ..._rest] = positionals;
    const merged = {
      _rest,
      commit: false,
      backup: true,
export { runCli as parseAndGetCommand };
      help: false,
      ...optsValues,
    } satisfies CLIOpts;

    // If user passed `--help` together with a subcommand, show that subcommand's help.
    if (merged.help) {
      if (cmdLocal) {
        printSubcommandHelp(cmdLocal);
        process.exit(0);
      }
      printUsage();
      process.exit(0);
    }

    // Support `markov help [subcommand]` as a positional-based help helper.
    if (cmdLocal === 'help') {
      const target = _rest[0];
      if (target) printSubcommandHelp(target);
      else printUsage();
      process.exit(0);
    }

    if (!cmdLocal) {
      printUsage();
      process.exit(1);
    }

    const file = merged.file ?? './var/model.json';
    if (cmdLocal === 'inspect') {
      const word = merged._rest?.[0];
      if (!word) { console.error('inspect <word>'); process.exit(1); }
      const model = await loadModelFromFile(file);
      const rows = inspectToken(model, word, Number(merged.top ?? '10'));
      console.log(`Top ${rows.length} for word: ${word}`);
      for (const [cand, weight] of rows) console.log(`${cand}\t${weight}`);
      return;
    }
    if (cmdLocal === 'generate') {
      const n = Number(merged.n ?? '1');
      const start = merged.start ?? '';
      const model = await loadModelFromFile(file);
      const out = generateSamples(model, start, n);
      out.forEach((s, i) => console.log(`${i + 1}: ${s}`));
      return;
    }

    console.error('Unknown command', cmdLocal);
    process.exit(1);
  } catch (err: any) {
    console.error('Argument parse error:', err?.message ?? String(err));
    console.error('Use --help for usage.');
    process.exit(2);
  }
}


