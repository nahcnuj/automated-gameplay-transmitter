#!/usr/bin/env bun
import { parseAndGetCommand } from '../src/lib/MarkovModel/cli.ts';

const run = parseAndGetCommand(process.argv.slice(2));

(async () => {
  await run();
})();
