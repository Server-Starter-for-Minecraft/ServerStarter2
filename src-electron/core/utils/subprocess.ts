import { Failable } from 'app/src-electron/api/failable';
import * as child_process from 'child_process';

// TODO: exitcodeに応じてFailableを返す

export const interactiveProcess = (
  process: string,
  args: string[],
  onout: (chunk: string) => void,
  onerr: (chunk: string) => void,
  cwd: string | undefined = undefined,
  shell = false
): [(message: string) => Promise<void>, Promise<Failable<undefined>>] => {
  const child = child_process.spawn(process, args, {
    cwd,
    shell,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  child.stdout.setEncoding('utf-8');
  child.stdout.on('data', onout);

  child.stderr.setEncoding('utf-8');
  child.stderr.on('data', onerr);

  return [
    (msg) =>
      new Promise((resolve) => child.stdin.write(msg + '\n', () => resolve())),
    prommisifyChildprocess(child, process, args),
  ];
};

export function execProcess(
  process: string,
  args: string[],
  cwd: string | undefined = undefined,
  shell = false
) {
  const child = child_process.spawn(process, args, { cwd, shell });

  return prommisifyChildprocess(child, process, args);
}

function prommisifyChildprocess(
  child: child_process.ChildProcess,
  process: string,
  args: string[]
) {
  function onExit(code: number | null) {
    if (code === 0 || code === null) return undefined;
    const command = process + ' ' + args.join(' ');
    return new Error(
      `error occured in running subprocess with exitcode:${code} command:${command}}`
    );
  }

  const promise = new Promise<Failable<undefined>>((resolve) => {
    child.on('exit', (code) => resolve(onExit(code)));
    child.on('error', (err) => resolve(err));
  });

  return promise;
}
