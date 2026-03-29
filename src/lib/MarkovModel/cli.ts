import fs from 'fs/promises';
import path from 'path';
import { parseArgs } from 'util';
import type { MarkovModel } from './MarkovModel';
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
  console.log('  inspect <word> [--help]   Show top candidate continuations for <word>');
  console.log('  generate [--help]         Generate sentences from the model');
  console.log('  help                  Show usage');
  console.log('Options:');
  console.log('  --help                Show this help (or use `markov <command> --help`)');
}

type InspectCommandBase = {
  file: string;
  word?: string;
  top?: number;
  help?: never;
};

type InspectCommandHelp = { help: true };

type InspectCommandOpts = InspectCommandBase | InspectCommandHelp;

type GenerateCommandBase = {
  file: string;
  start?: string;
  n?: number;
  commit?: boolean;
  backup?: boolean;
  help?: never;
};

type GenerateCommandHelp = { help: true };

type GenerateCommandOpts = GenerateCommandBase | GenerateCommandHelp;

async function inspectCommand(opts: InspectCommandOpts) {
  if ('help' in opts && opts.help) {
    console.log('Usage: markov inspect <word> [--top <num>] [--file <path>] [--help]');
    console.log('Show top candidate continuations for <word>.');
    console.log('Options:');
    console.log('  --top <num>    Number of top candidates to show (default 10)');
    console.log('  --file <path>  Model file (default ./var/model.json)');
    console.log('  --help         Show this help');
    process.exit(0);
  }
  const { file, word = '', top = 10 } = opts;
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

async function generateCommand(opts: GenerateCommandOpts) {
  if ('help' in opts && opts.help) {
    console.log('Usage: markov generate [--n <num>] [--start <word>] [--file <path>] [--help]');
    console.log('Generate sentences from the model.');
    console.log('Options:');
    console.log('  --n <num>      Number of samples to generate (default 1)');
    console.log('  --start <word>  Start word for generation');
    console.log('  --file <path>  Model file (default ./var/model.json)');
    console.log('  --help         Show this help');
    process.exit(0);
  }
  const { file, start = '', n = 1, commit = false, backup = true } = opts;
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
  // No args -> usage
  if (!argv || argv.length === 0) {
    printUsage();
    process.exit(1);
  }

  // If the invocation begins with a global flag, parse globally to
  // preserve the previous parse-error behaviour for unknown flags.
  const first = argv[0];
  if (typeof first === 'string' && first.startsWith('-')) {
    let global: any;
    try {
      global = parseArgs({
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
    if (global.values && global.values.help) {
      printUsage();
      process.exit(0);
    }
    printUsage();
    process.exit(1);
  }

  const cmd = argv[0] ?? '';
  const rest = argv.slice(1);

  // Per-command parse definitions and associated help metadata.
  const commandDefs: Record<string, any> = {
    inspect: {
      parseOptions: {
        file: { type: 'string' },
        top: { type: 'string' },
        help: { type: 'boolean' },
      },
      usage: 'Usage: markov inspect <word> [--top <num>] [--file <path>] [--help]',
      desc: 'Show top candidate continuations for <word>.',
      optsHelp: [
        ['--top <num>', 'Number of top candidates to show (default 10)'],
        ['--file <path>', 'Model file (default ./var/model.json)'],
        ['--help', 'Show this help'],
      ],
    },
    generate: {
      parseOptions: {
        file: { type: 'string' },
        start: { type: 'string' },
        n: { type: 'string' },
        commit: { type: 'boolean' },
        backup: { type: 'boolean' },
        help: { type: 'boolean' },
      },
      usage: 'Usage: markov generate [--n <num>] [--start <word>] [--file <path>] [--help]',
      desc: 'Generate sentences from the model.',
      optsHelp: [
        ['--n <num>', 'Number of samples to generate (default 1)'],
        ['--start <word>', 'Start word for generation'],
        ['--file <path>', 'Model file (default ./var/model.json)'],
        ['--commit', 'Write generated results back to model file'],
        ['--backup', 'Create a backup before writing (default true)'],
        ['--help', 'Show this help'],
      ],
    },
  };

  const printCommandHelp = (k: string) => {
    const def = commandDefs[k];
    if (!def) return;
    console.log(def.usage);
    console.log(def.desc);
    console.log('Options:');
    for (const [opt, d] of def.optsHelp) console.log(`  ${opt}  ${d}`);
  };

  // markov help <cmd>
  if (cmd === 'help') {
    const target = rest[0];
    if (target && commandDefs[target]) {
      printCommandHelp(target);
      process.exit(0);
    }
    if (target) {
      console.log(`No help available for unknown command: ${target}`);
      printUsage();
    } else {
      printUsage();
    }
    process.exit(0);
  }

  // Unknown command + --help fallback
  if ((rest.includes('--help') || rest.includes('-h')) && !(cmd in commandDefs)) {
    console.log(`No help available for unknown command: ${cmd}`);
    printUsage();
    process.exit(0);
  }

  // Dispatch to subcommands with per-command parsing
  if (cmd === 'inspect') {
    const def = commandDefs.inspect;
    let pr: any;
    try {
      pr = parseArgs({ args: rest, options: def.parseOptions, allowPositionals: true, strict: true });
    } catch (err: any) {
      console.error('Argument parse error:', err?.message ?? String(err));
      console.error('Use --help for usage.');
      process.exit(2);
    }
    const { values, positionals } = pr;
    if (values.help) {
      printCommandHelp('inspect');
      process.exit(0);
    }
    const file = values.file ?? './var/model.json';
    const top = Number(values.top ?? '10');
    const word = positionals[0] ?? '';
    await inspectCommand({ file, word, top });
    return;
  }

  if (cmd === 'generate') {
    const def = commandDefs.generate;
    let pr: any;
    try {
      pr = parseArgs({ args: rest, options: def.parseOptions, allowPositionals: true, strict: true });
    } catch (err: any) {
      console.error('Argument parse error:', err?.message ?? String(err));
      console.error('Use --help for usage.');
      process.exit(2);
    }
    const { values } = pr;
    if (values.help) {
      printCommandHelp('generate');
      process.exit(0);
    }
    const file = values.file ?? './var/model.json';
    const start = values.start ?? '';
    const n = Number(values.n ?? '1');
    const commit = values.commit ?? false;
    const backup = values.backup ?? true;
    await generateCommand({ file, start, n, commit, backup });
    return;
  }

  console.error('Unknown command', cmd);
  process.exit(1);
}
