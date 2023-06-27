import { WorldID } from 'app/src-electron/schema/world';
import { Path } from 'app/src-electron/util/path';
import { WorldSettings } from '../world/files/json';
import { WorldContainer } from 'app/src-electron/schema/brands';
import { Failable, isFailure } from 'app/src-electron/api/failable';
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
import { api } from '../api';
import { serverProcess } from './process';

class WorldUsingError extends Error {}

/** サーバー起動前の準備の内容 戻り値はJava実行時引数 */
export async function readyRunServer(
  cwdPath: Path,
  id: WorldID,
  settings: WorldSettings,
  container: WorldContainer,
  name: string,
  logger: (value: string) => void
) {
  // ワールドが起動中の場合エラー
  if (settings.using)
    return new WorldUsingError(
      `world ${container}/${name} is running by ${
        settings.last_user ?? '<annonymous>'
      }`
    );

  const javaArgs: string[] = [];

  // JAVAのstdioのエンコードをutf-8に
  javaArgs.push(...javaEncodingToUtf8());

  // 実行メモリ量のJAVA引数
  javaArgs.push(...(await getMemoryArguments(settings.memory)));

  // ユーザー定義JAVA引数
  const additionalJavaArgument = await getAdditionalJavaArgument(
    settings.javaArguments
  );
  if (isFailure(additionalJavaArgument)) {
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
  if (isFailure(server)) return server;

  // 実行javaを用意
  logger(`javaランタイムを準備中 (${server.component})`);
  const javaPath = await readyJava(server.component, true);
  // 実行javaが用意できなかった場合エラー
  if (isFailure(javaPath)) return javaPath;

  // log4jの設定
  logger('log4jの引数を設定中');
  const log4jarg = await getLog4jArg(cwdPath, settings.version, logger);
  // log4jのファイルがダウンロードできなかった場合エラー
  if (isFailure(log4jarg)) return log4jarg;
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
  if (isFailure(eulaResult)) return eulaResult;

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
  if (isFailure(needEula)) return needEula;

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
  if (isFailure(eulaAgreement)) return eulaAgreement;

  // Eulaに同意しなかった場合エラー
  if (!eulaAgreement) {
    return new Error(
      'To start server, you need to agree to Minecraft EULA (https://aka.ms/MinecraftEULA)'
    );
  }
}
