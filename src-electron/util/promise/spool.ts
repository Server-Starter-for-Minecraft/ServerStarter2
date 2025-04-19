/**
 * プロミスを直列実行するためのクラス
 *
 * 並列で処理されると問題が起こる場合に、あとから登録されたプロミスは前のプロミスがすべて終わるまで待機してから実行される
 */
export class PromiseSpooler {
  private spooling: (() => Promise<void>)[];

  constructor() {
    this.spooling = [];
  }

  // 実行中のプロミスが存在するか
  hasSpooled(): boolean {
    return this.spooling.length !== 0;
  }

  async spool<T>(promise: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // 待機列の先頭に来た時に呼ばれる
      const lazeInvoke = async () => {
        try {
          resolve(await promise());
        } catch (e) {
          reject(e);
        } finally {
          this.spooling.shift();
          // 次のlazeInvokeがあるなら呼び出す
          this.spooling[0]?.();
        }
      };

      // 待機列の最後にlazeInvokeを追加
      this.spooling.push(lazeInvoke);
      // 待機列が自分だけだったら即座に実行
      if (this.spooling.length === 1) lazeInvoke();
    });
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;
  const { sleep } = await import('./sleep');

  describe('Promise直列化のテスト', () => {
    test('プロミス1つで問題なく動く', async () => {
      const spooler = new PromiseSpooler();

      expect(spooler.hasSpooled(), '実行中のプロミスはない').toBe(false);

      const log: string[] = [];

      const promise1 = spooler.spool(async () => {
        log.push('1 start');
        await sleep(100);
        log.push('1 end');
        return 1;
      });

      expect(spooler.hasSpooled(), '実行中のプロミスあり').toBe(true);

      expect(await promise1).toBe(1);

      expect(spooler.hasSpooled(), '実行中のプロミスはない').toBe(false);
      expect(log, '実行中のプロミスはない').toEqual(['1 start', '1 end']);
    });

    test('プロミス複数が直列実行される', async () => {
      const spooler = new PromiseSpooler();

      expect(spooler.hasSpooled(), '実行中のプロミスはない').toBe(false);

      const log: string[] = [];

      const promise1 = spooler.spool(async () => {
        log.push('1 start');
        await sleep(100);
        log.push('1 end');
        return 1;
      });
      const promise2 = spooler.spool(async () => {
        log.push('2 start');
        await sleep(200);
        log.push('2 end');
        return 2;
      });

      expect(spooler.hasSpooled(), '実行中のプロミスあり').toBe(true);
      expect(log, '実行順の確認').toEqual(['1 start']);

      expect(await promise1).toBe(1);

      expect(spooler.hasSpooled(), '実行中のプロミスあり').toBe(true);
      expect(log, '実行順の確認').toEqual(['1 start', '1 end', '2 start']);

      expect(await promise2).toBe(2);

      expect(spooler.hasSpooled(), '実行中のプロミスなし').toBe(false);
      expect(log, '実行順の確認').toEqual([
        '1 start',
        '1 end',
        '2 start',
        '2 end',
      ]);
    });
  });
}
