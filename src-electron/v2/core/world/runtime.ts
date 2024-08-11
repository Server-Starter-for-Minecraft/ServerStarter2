import stringArgv from 'string-argv';
import { RuntimeSettings } from '../../schema/runtime';
import { err, ok, Result } from '../../util/base';

/**
 * ランタイム設定を解析して、javaの引数 (string[]) に変換する
 *
 * e.g. "-Xms1024M -Xmx3072M -XX:MetaspaceSize=128M -XX:MaxMetaspaceSize=256M" => ["-Xms1024M", "-Xmx3072M", "-XX:MetaspaceSize=128M", "-XX:MaxMetaspaceSize=256M"]
 *
 * TODO: @MojaMonchi @nozz-mat
 * @param runtimeSettings
 */
export function getJvmArgs(runtimeSettings: RuntimeSettings): Result<string[]> {
  try {
    if ('jvmarg' in runtimeSettings) {
      // 引数内にスペースが入ったりする可能性もあるので、
      // 解析処理自体は string-argv に任せた
      const jvmargArray = stringArgv(runtimeSettings.jvmarg);
      return ok(jvmargArray);
    }
    if ('memory' in runtimeSettings) {
      const memoryArray = runtimeSettings.memory;
      let memorySize = '';
      switch (memoryArray[1]) {
        case 'MB':
          memorySize = `${memoryArray[0]}M`;
          break;
        case 'GB':
          memorySize = `${memoryArray[0]}G`;
          break;
        case 'TB':
          memorySize = `${memoryArray[0]}T`;
          break;
      }
      return ok([`-Xms${memorySize}`, `-Xmx${memorySize}`]);
    }
    const _: never = runtimeSettings;
    return err(new Error('Unreachable'));
  } catch (error) {
    return err(error as Error);
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('jvmarg を渡されたときに解析を走らせる', () => {
    expect(
      getJvmArgs({
        jvmarg:
          '-Xms1024M -Xmx3072M -XX:MetaspaceSize=128M -XX:MaxMetaspaceSize=256M -Duser.timezone="America/Los Angeles"',
      }).value()
    ).toEqual([
      '-Xms1024M',
      '-Xmx3072M',
      '-XX:MetaspaceSize=128M',
      '-XX:MaxMetaspaceSize=256M',
      '-Duser.timezone="America/Los Angeles"',
    ]);
  });

  interface TestCase {
    memory: [number, 'MB' | 'GB' | 'TB'];
    xmArray: [string, string];
  }

  const testCases: TestCase[] = [
    {
      memory: [2, 'MB'],
      xmArray: ['-Xms2M', '-Xmx2M'],
    },
    {
      memory: [2, 'GB'],
      xmArray: ['-Xms2G', '-Xmx2G'],
    },
    {
      memory: [2, 'TB'],
      xmArray: ['-Xms2T', '-Xmx2T'],
    },
  ];

  test.each(testCases)(
    ' memory を渡されたときに、XmsとXmxに適切な値を設定して返す',
    (tCase) => {
      // TODO: "MB" | "GB" | "TB" に対応していることをテストで確認する
      expect(getJvmArgs({ memory: tCase.memory }).value()).toEqual(
        tCase.xmArray
      );
    }
  );
}
