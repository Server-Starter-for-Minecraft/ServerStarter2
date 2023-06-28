import { WorldID } from 'app/src-electron/schema/world';
import { Path } from 'app/src-electron/util/path';
import { WorldSettings } from '../world/files/json';
import { WorldContainer } from 'app/src-electron/schema/brands';
import {
  getAdditionalJavaArgument,
  javaEncodingToUtf8,
} from './setup/javaArgs';
import { getMemoryArguments } from './setup/memory';
import { needEulaAgreement, readyVersion } from '../version/version';
import { readyJava } from 'app/src-electron/util/java/java';
import { getLog4jArg } from './setup/log4j';
import { VersionComponent } from '../version/base';
import { Version } from 'app/src-electron/schema/version';
import { checkEula } from './setup/eula';
import { isError } from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/util/error/failable';
import { errorMessage } from 'app/src-electron/util/error/construct';

/** サーバー起動前の準備の内容 戻り値はJava実行時引数 */
export async function readyRunServer(
  cwdPath: Path,
  id: WorldID,
  settings: WorldSettings,
  logger: (value: string) => void
): Promise<Failable<{ javaArgs: string[]; javaPath: Path }>> {
  // ワールドが起動中の場合
  // 致命的なエラー(この関数を呼ぶ時点でバリデーションを掛けておくこと)
  if (settings.using) throw new Error();

  const javaArgs: string[] = [];

  // JAVAのstdioのエンコードをutf-8に
  javaArgs.push(...javaEncodingToUtf8());

  // 実行メモリ量のJAVA引数
  javaArgs.push(...(await getMemoryArguments(settings.memory)));

  // ユーザー定義JAVA引数
  const additionalJavaArgument = await getAdditionalJavaArgument(
    settings.javaArguments
  );
  if (isError(additionalJavaArgument)) {
    // TODO: エラーの伝達方法を変更
    logger(additionalJavaArgument.toString());
  } else {
    javaArgs.push(...additionalJavaArgument);
  }

  // サーバーデータ準備
  logger(
    `サーバーデータを準備中 ${settings.version.id} (${settings.version.type})`
  );
  const server = await readyVersion(settings.version, cwdPath);
  // サーバーデータの用意ができなかった場合エラー
  if (isError(server)) return server;

  // 実行javaを用意
  logger(`javaランタイムを準備中 (${server.component})`);
  const javaPath = await readyJava(server.component, true);
  // 実行javaが用意できなかった場合エラー
  if (isError(javaPath)) return javaPath;

  // log4jの設定
  logger('log4jの引数を設定中');
  const log4jarg = await getLog4jArg(cwdPath, settings.version, logger);
  // log4jのファイルがダウンロードできなかった場合エラー
  if (isError(log4jarg)) return log4jarg;
  // log4j引数を実行時引数に追加
  if (log4jarg) javaArgs.push(log4jarg);

  // Eulaの同意チェック
  const eulaResult = await assertEula(
    id,
    cwdPath,
    server,
    settings.version,
    javaPath,
    logger
  );
  if (isError(eulaResult)) return eulaResult;

  // サーバーのjarファイル参照を実行時引数に追加
  javaArgs.push(...server.programArguments, '--nogui');

  return { javaArgs, javaPath };
}

/** Eulaチェック(拒否した場合エラーを返す) */
async function assertEula(
  id: WorldID,
  cwdPath: Path,
  server: VersionComponent,
  version: Version,
  javaPath: Path,
  logger: (value: string) => void
) {
  const needEula = needEulaAgreement(version);
  // Eulaチェックが必要かどうかの検証に失敗した場合エラー
  if (isError(needEula)) return needEula;

  if (!needEula) return undefined;

  // Eulaチェック
  logger('Eulaの同意状況を確認中');
  const eulaAgreement = await checkEula(
    id,
    javaPath,
    server.programArguments,
    cwdPath
  );

  // Eulaチェックに失敗した場合エラー
  if (isError(eulaAgreement)) return eulaAgreement;

  // Eulaに同意しなかった場合エラー
  if (!eulaAgreement) {
    return errorMessage.core.minecraftEULANotAccepted();
  }
}
