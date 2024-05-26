import { ChildProcess, spawn, SpawnOptions } from 'child_process';
import * as stream from 'stream';
import { Err, err, none, ok, Opt, Result, value } from '../base';
import { Readable, WritableStreamer } from './stream';

export interface SubprocessOptions {}

/**
 * サブプロセスの生成と実行
 *
 * 基本的には child_process.spawn を使いやすくした形
 *
 * subprocess.stdout.into(target) で標準出力からの読み込みができる
 *
 * source.into(subprocess) で標準入力への書き込みができる
 *
 * source.into(subprocess) はsourceかsubprocessが終了した際に終了するが、
 * 残ったほうのストリームを自動で閉じることはないので注意
 *
 * TODO: source がエラー吐いた時と subprocess が終了したときに unpipe する
 *
 * T : ステータスコード
 */
export class Subprocess extends WritableStreamer<void> {
  subprocess: ChildProcess;

  constructor(subprocess: ChildProcess) {
    super();
    this.subprocess = subprocess;
    subprocess.stdout;
  }

  static spawn(
    command: string,
    args: readonly string[],
    options: SpawnOptions
  ) {
    return new Subprocess(spawn(command, args, options));
  }

  /** 標準出力 */
  get stdout(): Opt<Readable> {
    if (this.subprocess.stdout === null) return none;
    return value(new Readable(this.subprocess.stdout));
  }

  /** 標準エラー */
  get stderr(): Opt<Readable> {
    if (this.subprocess.stderr === null) return none;
    return value(new Readable(this.subprocess.stderr));
  }

  /**
   * 書き込むやつ
   * @param readable サブプロセスかreadableが終了したら終了。サブプロセスが終了してもreadableは自動では終了しないので注意
   */
  async write(readable: stream.Readable): Promise<Result<void, Error>> {
    const writable = this.subprocess.stdin;
    if (writable === null) return err(new Error('STDIN_IS_NULL'));

    let e: Err<Error> | undefined = undefined;
    return new Promise<Result<undefined, Error>>((resolve) => {
      // エラーになった時は自動でunpipeされる
      readable
        .on('close', () => {
          // 入力ストリームが終了したら終了
          if (e !== undefined) return resolve(e);
          resolve(ok(undefined));
        })
        .on('error', (error) => (e = err(error)))
        .pipe(writable)
        .on('close', () => {
          // 出力ストリームが終了したら終了
          if (e !== undefined) return resolve(e);
          resolve(ok(undefined));
        })
        .on('error', (error) => (e = err(error)));
    });
  }

  /**
   * プロセスの終了を待機
   *
   *  Result.value
   *  - number の場合はExitCode
   *  - string の場合はSignal
   */
  promise(): Promise<Result<number | string, Error>> {
    return new Promise<Result<number | string, Error>>((resolve) => {
      // すでに終了している場合
      if (this.subprocess.pid === undefined) {
        const code = this.subprocess.exitCode ?? this.subprocess.signalCode;
        if (code === null) throw new Error('ASSERTION');
        return resolve(ok(code));
      }
      this.subprocess
        .on('error', (e) => resolve(err(e)))
        .on('exit', (code, signal) => {
          const result = code ?? signal;
          if (result === null) throw new Error('ASSERTION');
          resolve(ok(result));
        });
    });
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { Bytes } = await import('./bytes');
  const { test, expect } = import.meta.vitest;
  test('', async () => {
    const proc = spawn('echo', ['hello world'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: './',
      shell: true,
      env: { ...process.env, LANG: 'en_US.UTF-8' },
    });
    const sub = new Subprocess(proc);
    const result = await sub.stdout.value.into(Bytes);
    // OSによって改行コードが違うのでとりあえずtrimEndで対処
    expect(result.value.toStr().value.trimEnd()).toEqual('hello world');

    //TODO: readable.into(subprocess) したときに、(readable|subprocess)が先に(終了|エラー)するときの挙動を確認する
  });
}
