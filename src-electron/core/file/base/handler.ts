import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError } from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/util/error/failable';
import { Path } from 'app/src-electron/util/path';
import { isDeepStrictEqual } from 'util';
import { Fail, Fixer, isFail } from './fixer/fixer';

/**
 * JSON形式の設定ファイルを扱うためのクラス
 * 何度も同じファイルを読みとることを回避するためにキャッシュデータを持つ
 */
export class JsonFileHandler<T, FAILABLE extends boolean> {
  path: Path;
  fixer: Fixer<T, FAILABLE>;
  value: Failable<T>;

  constructor(path: Path, fixer: Fixer<T, FAILABLE>) {
    this.path = path;
    this.fixer = fixer;

    this.value = errorMessage.data.path.loadingFailed({
      type: 'file',
      path: path.str(),
    });
  }

  /**
   * 設定ファイルを読み込む
   * @param flush - false:前回読み込んだデータを使用 true:ファイルを再読み込み
   */
  async load(flush = false): Promise<Failable<T>> {
    if (flush || isError(this.value)) {
      const json = await this.path.readJson<T>();
      const value: T | Fail = this.fixer.fix(json);
      if (isFail(value)) {
        // fixに失敗した場合
        this.value = errorMessage.data.failJsonFix();
      } else {
        this.value = value;
        if (!isDeepStrictEqual(this.value, json)) {
          // fix結果がfix前と異なっていた場合
          await this.save(this.value);
        }
      }
    }
    return this.value;
  }

  /** 設定ファイルを保存 */
  async save(value: T): Promise<void> {
    this.value = value;
    await this.path.writeJson(value);
  }

  /** キャッシュデータを解放 */
  purge() {
    this.value = errorMessage.data.path.loadingFailed({
      type: 'file',
      path: this.path.str(),
    });
  }
}
