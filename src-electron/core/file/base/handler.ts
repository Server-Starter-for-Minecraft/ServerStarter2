import { Fixer } from 'app/src-electron/util/detaFixer/fixer';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError } from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/util/error/failable';
import { Path } from 'app/src-electron/util/path';

export class JsonFileHandler<T> {
  path: Path;
  fixer: Fixer<T>;
  value: Failable<T>;

  constructor(path: Path, fixer: Fixer<T>) {
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
      this.value = this.fixer(json);
    }
    return this.value;
  }

  /** 設定ファイルを保存 */
  async save(value: T): Promise<void> {
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
