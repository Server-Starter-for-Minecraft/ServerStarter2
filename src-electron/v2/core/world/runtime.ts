import { RuntimeSettings } from '../../schema/runtime';
import { Result, ok } from '../../util/base';

/**
 * ランタイム設定を解析して、javaの引数 (string[]) に変換する
 *
 * 既存のコマンドライン引数パーサーがある場合そちらを使ったほうがいいかも
 *
 * e.g. "-Xms1024M -Xmx3072M -XX:MetaspaceSize=128M -XX:MaxMetaspaceSize=256M" => ["-Xms1024M", "-Xmx3072M", "-XX:MetaspaceSize=128M", "-XX:MaxMetaspaceSize=256M"]
 *
 * TODO: @MojaMonchi @nozz-mat
 * @param runtimeSettings
 */
export function getJvmArgs(runtimeSettings: RuntimeSettings): Result<string[]> {
  return ok([]);
}
