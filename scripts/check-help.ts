import { runCli } from '../src/lib/MarkovModel/cli';

(async () => {
  const logs: string[] = [];
  const origLog = console.log;
  const origExit = (process as any).exit;
  (console as any).log = (...a: any[]) => { logs.push(a.join(' ')); };
  (process as any).exit = (c = 0) => { throw new Error('EXIT:' + c); };
  try {
    await runCli(['inspect', '--help']);
  } catch (err: any) {
    // swallow
  } finally {
    (process as any).exit = origExit;
    (console as any).log = origLog;
  }
  console.log('CAPTURED LOGS:');
  console.log(logs.join('\n'));
})();
