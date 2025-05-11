import { parseCommandLine } from 'app/src-electron/util/commandLineParser';
import { isError } from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/util/error/failable';
import { getSystemSettings } from '../../stores/system';

/** ユーザー設定のJavaの実行時引数を反映する */
export async function getAdditionalJavaArgument(
  args: string | undefined
): Promise<Failable<string[]>> {
  const arg = args ?? (await getSystemSettings()).world.javaArguments;
  if (arg === undefined) return [];
  const result = parseCommandLine(arg);
  if (isError(result)) return result;
  return result;
}