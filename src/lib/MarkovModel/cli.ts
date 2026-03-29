import { promises as fs } from 'fs';
import path from 'path';
import { parseArgs } from 'util';
import type { MarkovModelData, WeightedCandidates } from './MarkovModel';
import { generateSamples, inspectToken } from './MarkovModel';

/**
 * Parsed CLI options structure returned by the argument parser.
 *
 * - `_rest`: positional arguments remaining after options are parsed.
 * - `file`, `start`, `n`, `top`: optional string flags passed on the CLI.
 * - `commit`, `backup`, `help`: boolean flags.
 */
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

/**
 * Parse and validate a raw model wrapper object into `MarkovModelData`.
 *
 * The function expects an object shaped `{ model: unknown }`. It validates
 * that `model` is a plain record whose values are numeric-weight maps, and
 * that the required empty-string key (`''`) exists. On validation failure an
 * `Error` is thrown.
 *
 * @param model - Raw parsed JSON value representing the model object.
 * @returns A validated `MarkovModelData` object.
 * @throws {Error} If the input is not a valid model format.
 */
export function parseMarkovModelData(model: unknown): MarkovModelData {
  const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

  if (!isRecord(model)) throw new Error('Invalid model format');

  const isWeightedCandidates = (v: unknown): v is WeightedCandidates => {
    if (!isRecord(v)) return false;
    return Object.values(v).every((x) => typeof x === 'number');
  };

  const startGroup = model[''];
  if (!isWeightedCandidates(startGroup)) throw new Error('Invalid model format');

  const validated: MarkovModelData = {
    '': startGroup,
  };

  for (const key of Object.keys(model).filter(key => key !== '')) {
    const group = model[key];
    if (!isWeightedCandidates(group)) throw new Error('Invalid model format');
    validated[key] = group;
  }

  return validated;
}

/**
 * Load a model from the filesystem and parse it into `MarkovModelData`.
 *
 * Reads the file at `filePath`, JSON-parses its contents and delegates
 * validation to `parseMarkovModelData`.
 *
 * @param filePath - Path to the model JSON file.
 * @returns The validated `MarkovModelData`.
 * @throws {Error|SyntaxError} If the file cannot be read, parsed, or validated.
 */
export async function loadModelFromFile(filePath: string): Promise<MarkovModelData> {
  const resolved = path.resolve(process.cwd(), filePath);
  const txt = await fs.readFile(resolved, 'utf8');
  const raw = JSON.parse(txt);
  return parseMarkovModelData(raw);
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
  // Isolate argument parsing so that later `process.exit` calls are not
  // accidentally caught by a surrounding try/catch during tests.
  const parseResult = (() => {
    try {
      return parseArgs({
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
      });
    } catch (err: any) {
      console.error('Argument parse error:', err?.message ?? String(err));
      console.error('Use --help for usage.');
      process.exit(2);
    }
  })();

  if (!parseResult) process.exit(2);
  const { values: optsValues, positionals } = parseResult;

  const [cmdLocal, ..._rest] = positionals;
  const merged: CLIOpts = {
    _rest,
    file: typeof optsValues.file === 'string' ? optsValues.file : undefined,
    start: typeof optsValues.start === 'string' ? optsValues.start : undefined,
    n: typeof optsValues.n === 'string' ? optsValues.n : undefined,
    top: typeof optsValues.top === 'string' ? optsValues.top : undefined,
    commit: Boolean(optsValues.commit),
    backup: optsValues.backup === undefined ? true : Boolean(optsValues.backup),
    help: Boolean(optsValues.help),
  };

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
}

// exported as named function `runCli` above


