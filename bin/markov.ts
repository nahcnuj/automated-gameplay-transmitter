#!/usr/bin/env bun
import { parseAndGetCommand } from '../src/lib/MarkovModel/cli.ts';

await parseAndGetCommand(process.argv.slice(2));
