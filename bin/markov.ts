#!/usr/bin/env bun
import { runCli } from '../src/lib/MarkovModel/cli.ts';

await runCli(process.argv.slice(2));
