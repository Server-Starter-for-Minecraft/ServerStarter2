import { RuntimeSettings } from '../../schema/runtime';
import { ok, Result } from '../../util/base';

/**
 * ランタイム設定を解析して、javaの引数 (string[]) に変換する
 *
 * e.g. "-Xms1024M -Xmx3072M -XX:MetaspaceSize=128M -XX:MaxMetaspaceSize=256M" => ["-Xms1024M", "-Xmx3072M", "-XX:MetaspaceSize=128M", "-XX:MaxMetaspaceSize=256M"]
 *
 * TODO: @MojaMonchi @nozz-mat
 * @param runtimeSettings
 */
export function getJvmArgs(runtimeSettings: RuntimeSettings): Result<string[]> {
  return ok([]);
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('jvmarg を渡されたときに解析を走らせる', () => {
    // 引数内にスペースが入ったりする可能性もあるので、
    // 解析処理自体は https://github.com/minimistjs/minimist に任せるのがいいかも
    expect(
      getJvmArgs({
        jvmarg:
          '-Xms1024M -Xmx3072M -XX:MetaspaceSize=128M -XX:MaxMetaspaceSize=256M',
      })
    ).toEqual([
      '-Xms1024M',
      '-Xmx3072M',
      '-XX:MetaspaceSize=128M',
      '-XX:MaxMetaspaceSize=256M',
    ]);
  });

  test(' memory を渡されたときに、XmsとXmxに適切な値を設定して返す', () => {
    // TODO: "MB" | "GB" | "TB" に対応していることをテストで確認する
    expect(
      getJvmArgs({
        memory: [2, 'GB'],
      })
    ).toEqual(['-Xms2G', '-Xmx2G']);
  });
}
