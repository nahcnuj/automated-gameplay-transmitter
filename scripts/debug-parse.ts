import { parseArgs } from 'util';

try {
  const args = ['inspect', '--help'];
  const res = parseArgs({
    args,
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
  console.log('parseResult:');
  console.log(JSON.stringify(res, null, 2));
} catch (err) {
  console.error('parse error', err);
}
