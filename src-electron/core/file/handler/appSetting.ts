import { Path } from 'app/src-electron/util/path';
import { safeStorage } from 'electron';
import { isDeepStrictEqual } from 'util';
import { Fixer } from '../base/fixer/fixer';

/**
 * JSON形式の設定ファイルを扱うためのクラス
 * 何度も同じファイルを読みとることを回避するためにキャッシュデータを持つ
 */
export class AppSettingHandler<T> {
  path: Path;
  fixer: Fixer<T, false>;
  value: T | undefined;

  constructor(path: Path, fixer: Fixer<T, false>) {
    this.path = path;
    this.fixer = fixer;

    this.value = undefined;
  }

  /**
   * 設定ファイルを読み込む
   * @param flush - false:前回読み込んだデータを使用 true:ファイルを再読み込み
   */
  load(flush = false): T {
    if (flush || this.value === undefined) {
      let json: any;
      try {
        // 読み取って復号
        const buffer = this.path.readBufferSync();
        const data = safeStorage.decryptString(buffer);
        json = JSON.parse(data);
      } catch {
        json = {};
      }
      this.value = this.fixer.fix(json);
      // fix結果がfix前と異なっていた場合
      if (!isDeepStrictEqual(this.value, json)) {
        this.save(this.value);
      }
    }
    return this.value;
  }

  /** 設定ファイルを保存 */
  save(value: T): void {
    this.value = value;

    // 暗号化
    const encrypted = safeStorage.encryptString(JSON.stringify(value));

    // 保存
    this.path.writeBufferSync(encrypted);
  }

  /** キャッシュデータを解放 */
  purge() {
    this.value = undefined;
  }
}
