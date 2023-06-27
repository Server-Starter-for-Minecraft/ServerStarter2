import { Failable, isFailure } from 'app/src-electron/api/failable';
import { getSystemSettings } from '../../stores/system';
import { parseCommandLine } from 'app/src-electron/util/commandLineParser';

/** ユーザー設定のJavaの実行時引数を反映する */
export async function getAdditionalJavaArgument(
  args: string | undefined
): Promise<Failable<string[]>> {
  const arg = args ?? (await getSystemSettings()).world.javaArguments;
  if (arg === undefined) return [];
  const result = parseCommandLine(arg);
  if (isFailure(result)) return result;
  return result;
}

/** stdin,stdout,stderrの文字コードをutf-8に */
export function javaEncodingToUtf8() {
  return ['"-Dfile.encoding=UTF-8"'];
}
