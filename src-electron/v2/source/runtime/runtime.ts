import { Runtime } from '../../schema/runtime';
import { Result } from '../../util/base';
import { Path } from '../../util/binary/path';

export class RuntimeContainer {
  static list(): Promise<>;

  /** 指定されたランタイムを導入して実行パスを返す */
  static install(runtime: Runtime): Promise<Result<Path>>;
}
