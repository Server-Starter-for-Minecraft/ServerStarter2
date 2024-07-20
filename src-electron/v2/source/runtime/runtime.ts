import { OsPlatform } from 'app/src-electron/schema/os';
import { Runtime } from '../../schema/runtime';
import { Result } from '../../util/base';
import { Path } from '../../util/binary/path';

// 実装指示コメントとsrctest\assets\cacheの内容はtxkodoが適当に考えたやつなんで
// 別の策を使うなら無視してもOK!

// 既存実装 -> src-electron\util\java\java.ts

export class RuntimeContainer {
  private cacheDirPath: Path;

  constructor(cacheDirPath: Path) {
    this.cacheDirPath = cacheDirPath;
  }

  /**
   * 指定されたランタイムを導入して実行パスを返す
   *
   * キャッシュに存在する場合はそれを使用
   */
  async ready(runtime: Runtime, osPlatform: OsPlatform): Promise<Result<Path>> {
    // 指定のバージョンのmeta読みに行く -> metaにあるruntimePathの存在を確認 -> あったらそれでOK
    // どっちかなかったらインストールしてmetaを作成
  }

  /**
   * 指定されたランタイムをキャッシュから削除
   */
  async remove(
    runtime: Runtime,
    osPlatform: OsPlatform
  ): Promise<Result<Path>> {
    // 指定のバージョンのmeta読みに行く -> metaにあるruntimePathの存在を確認 -> あったらmetaとruntime両削除
  }
}

// src-electron\v2\source\runtime\test\assets\cache\meta
// こっちにランタイムの情報とパスを格納
//
// src-electron\v2\source\runtime\test\assets\cache\meta
// こっちにランタイム本体のパスを格納
//
