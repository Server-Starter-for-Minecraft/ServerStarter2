import { Failable, isFailure } from 'app/src-electron/api/failable';
import { World } from 'app/src-electron/schema/world';
import { getSystemSettings } from '../stores/system';
import { parseCommandLine } from 'app/src-electron/util/commandLineParser';

/** ユーザー設定のJavaの実行時引数を反映する */
export async function getAdditionalJavaArgument(
  world: World
): Promise<Failable<string[]>> {
  const arg =
    world.javaArguments ?? (await getSystemSettings()).world.javaArguments;
  if (arg === undefined) return [];
  const result = parseCommandLine(arg);
  if (isFailure(result)) return result;
  return result;
}

/** stdin,stdout,stderrの文字コードをutf-8に */
export function javaEncodingToUtf8() {
  return ['"-Dfile.encoding=UTF-8"'];
}