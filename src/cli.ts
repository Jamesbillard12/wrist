#!/usr/bin/env node
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { compile } from './compiler.js';

async function main(args: string[]): Promise<void> {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: wrist <input.tsx> [--out <output.swift>]');
    return;
  }
  if (args.length !== 1 && (args.length !== 3 || args[1] !== '--out' || !args[2])) {
    throw new Error('Usage: wrist <input.tsx> [--out <output.swift>]');
  }
  const input = resolve(args[0]);
  const output = args[2] ? resolve(args[2]) : undefined;
  const swift = compile(await readFile(input, 'utf8'), input);
  if (output) {
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, swift, 'utf8');
    console.log(`Generated ${output}`);
  } else {
    process.stdout.write(swift);
  }
}

main(process.argv.slice(2)).catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
