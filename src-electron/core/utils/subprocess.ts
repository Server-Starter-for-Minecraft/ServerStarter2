import * as child_process from 'child_process';

export const interactiveProcess = (
  process: string,
  args: string[],
  onout: (chunk: string) => void,
  onerr: (chunk: string) => void,
  cwd: string | undefined = undefined,
  shell = false
): [(message: string) => Promise<void>, Promise<number | null>] => {
  const child = child_process.spawn(process, args, {
    cwd,
    shell,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  child.stdout.setEncoding('utf-8');
  child.stdout.on('data', onout);

  child.stderr.setEncoding('utf-8');
  child.stderr.on('data', onerr);

  const promise = new Promise<number | null>((resolve, reject) => {
    child.on('exit', resolve);
    child.on('error', reject);
  });

  return [
    (msg) =>
      new Promise((resolve) => child.stdin.write(msg + '\n', () => resolve())),
    promise,
  ];
};

export function execProcess(
  process: string,
  args: string[],
  cwd: string | undefined = undefined,
  shell = false
) {
  const child = child_process.spawn(process, args, {
    cwd,
    shell,
  });

  const promise = new Promise<number | null>((resolve, reject) => {
    child.on('exit', resolve);
    child.on('error', reject);
  });

  return promise;
}
