import fs from 'fs/promises';
import path from 'path';
import { parseArgs } from 'util';
import type { MarkovModelData, WeightedCandidates, MarkovModel } from './MarkovModel';
import { create, inspectWord, parseModelFile } from './MarkovModel';

/**
 * Parsed CLI options structure returned by the argument parser.
 *
 * - `_rest`: positional arguments remaining after options are parsed.
 * - `file`, `start`, `n`, `top`: optional string flags passed on the CLI.
 * - `commit`, `backup`, `help`: boolean flags.
 */
type CLIOpts = {
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
// parsing/validation delegated to MarkovModel.parseModelFile

/**
 * Read and parse a JSON file from disk.
 *
 * This helper resolves `filePath` against the current working directory,
 * reads the file contents and returns the result of `JSON.parse`.
 *
 * @param filePath - Path to the JSON file.
 * @returns The parsed JSON value.
 * @throws {Error|SyntaxError} If the file cannot be read or parsed.
 */
async function readJsonFile(filePath: string): Promise<unknown> {
  const resolved = path.resolve(process.cwd(), filePath);
  const txt = await fs.readFile(resolved, 'utf8');
  return JSON.parse(txt);
}

/**
 * Print a short usage summary for the CLI to stdout.
 *
 * This is a small, human-oriented helper used by `runCli` when printing
 * top-level usage information or when unknown commands are given.
 */
function printUsage() {
  console.log('Usage: markov <inspect|generate> [options]');
  console.log('Commands:');
  console.log('  inspect <word>        Show top candidate continuations for <word>');
  console.log('  generate              Generate sentences from the model');
  console.log('  help                  Show usage');
  console.log('Options:');
  console.log('  --file <path>         Model file (default ./var/model.json)');
  console.log('  --start <word>       Start word for generation');
  console.log('  --n <num>             Number of samples to generate');
  console.log('  --top <num>           Top N candidates for inspect');
  console.log('  --commit              Commit learned changes to the model file (learn only)');
  console.log('  --backup              Create a backup when committing changes');
}

type InspectCommandOpts = {
  file: string;
  word?: string;
  top?: number;
  help?: boolean;
};

type GenerateCommandOpts = {
  file: string;
  start?: string;
  n?: number;
  commit?: boolean;
  backup?: boolean;
  help?: boolean;
};

async function inspectCommand({ file, word = '', top = 10, help = false }: InspectCommandOpts) {
  if (help) {
    console.log('Usage: markov inspect <word> [--top <num>] [--file <path>]');
    console.log('Show top candidate continuations for <word>.');
    console.log('Options:');
    console.log('  --top <num>    Number of top candidates to show (default 10)');
    console.log('  --file <path>  Model file (default ./var/model.json)');
    process.exit(0);
  }
  if (!word) { console.error('inspect <word>'); process.exit(1); }
  const raw = await readJsonFile(file);
  const parsedFile = parseModelFile(raw);
  const parsed = parsedFile.model;
  const corpus = parsedFile.corpus ?? [];
  const m: MarkovModel = create(parsed, corpus);
  const rows = inspectWord(m.json.model, word, top);
  console.log(`Top ${rows.length} for word: ${word}`);
  for (const [cand, weight] of rows) console.log(`${cand}\t${weight}`);
}

async function generateCommand({ file, start = '', n = 1, commit = false, backup = true, help = false }: GenerateCommandOpts) {
  if (help) {
    console.log('Usage: markov generate [--n <num>] [--start <word>] [--file <path>]');
    console.log('Generate sentences from the model.');
    console.log('Options:');
    console.log('  --n <num>      Number of samples to generate (default 1)');
    console.log('  --start <word>  Start word for generation');
    console.log('  --file <path>  Model file (default ./var/model.json)');
    process.exit(0);
  }
  const raw = await readJsonFile(file);
  const parsedFile = parseModelFile(raw);
  const parsed = parsedFile.model;
  const corpus = parsedFile.corpus ?? [];
  const m: MarkovModel = create(parsed, corpus);
  const out = Array.from({ length: n }, () => m.gen(start));
  out.forEach((s, i) => console.log(`${i + 1}: ${s}`));

  if (commit) {
    try {
      if (backup) {
        const bak = `${file}.bak.${Date.now()}`;
        await fs.copyFile(file, bak);
      }
      const toWrite = { model: m.json.model, corpus };
      await fs.writeFile(file, JSON.stringify(toWrite, null, 2), 'utf8');
    } catch (err: any) {
      console.error('Failed to write model file:', String(err));
      process.exit(1);
    }
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

  // If user passed `--help` together with a subcommand, delegate help
  // printing to the individual command handlers so each command can
  // provide its own subcommand-specific help text.
  if (merged.help) {
    if (cmdLocal) {
      const filePath = merged.file ?? './var/model.json';
      if (cmdLocal === 'inspect') {
        await inspectCommand({ file: filePath, word: merged._rest?.[0] ?? '', top: Number(merged.top ?? '10'), help: true });
        return;
      }
      if (cmdLocal === 'generate') {
        const start = merged.start ?? '';
        const n = Number(merged.n ?? '1');
        await generateCommand({ file: filePath, start, n, commit: merged.commit, backup: merged.backup, help: true });
        return;
      }
      // Fallback for unknown subcommands
      console.log(`No help available for unknown command: ${cmdLocal}`);
      printUsage();
      process.exit(0);
    }
    printUsage();
    process.exit(0);
  }

  // Support `markov help [subcommand]` as a positional-based help helper.
  if (cmdLocal === 'help') {
    const target = _rest[0];
    const filePath = merged.file ?? './var/model.json';
    if (target === 'inspect') {
      await inspectCommand({ file: filePath, word: merged._rest?.[0] ?? '', top: Number(merged.top ?? '10'), help: true });
      return;
    }
    if (target === 'generate') {
      const start = merged.start ?? '';
      const n = Number(merged.n ?? '1');
      await generateCommand({ file: filePath, start, n, commit: merged.commit, backup: merged.backup, help: true });
      return;
    }
    if (target) {
      console.log(`No help available for unknown command: ${target}`);
      printUsage();
    } else {
      printUsage();
    }
    process.exit(0);
  }

  if (!cmdLocal) {
    printUsage();
    process.exit(1);
  }

  const file = merged.file ?? './var/model.json';
  if (cmdLocal === 'inspect') {
    const word = merged._rest?.[0];
    await inspectCommand({ file, word: word ?? '', top: Number(merged.top ?? '10') });
    return;
  }
  if (cmdLocal === 'generate') {
    const n = Number(merged.n ?? '1');
    const start = merged.start ?? '';
    await generateCommand({ file, start, n, commit: merged.commit, backup: merged.backup });
    return;
  }

  console.error('Unknown command', cmdLocal);
  process.exit(1);
}
