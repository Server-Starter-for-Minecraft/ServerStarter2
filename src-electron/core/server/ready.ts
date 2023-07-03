import { WorldID } from 'app/src-electron/schema/world';
import { Path } from 'app/src-electron/util/path';
import { WorldSettings } from '../world/files/json';
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
import { isError, isValid } from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/util/error/failable';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { PlainProgressor } from '../progress/progress';

/** サーバー起動前の準備の内容 戻り値はJava実行時引数 */
export async function readyRunServer(
  cwdPath: Path,
  id: WorldID,
  settings: WorldSettings,
  progress: PlainProgressor
): Promise<Failable<{ javaArgs: string[]; javaPath: Path }>> {
  // ワールドが起動中の場合
  // 致命的なエラー(この関数を呼ぶ時点でバリデーションを掛けておくこと)
  if (settings.using) throw new Error();

  const javaArgs: string[] = [];

  // JAVAのstdioのエンコードをutf-8に
  javaArgs.push(...javaEncodingToUtf8());

  async function memoryArg() {
    // 実行メモリ量のJAVA引数
    return await progress.withPlain(() => getMemoryArguments(settings.memory), {
      title: {
        key: 'server.java.memoryArguments',
      },
    });
  }

  async function userArg() {
    // ユーザー定義JAVA引数
    const additionalJavaArgument = await progress.withPlain(
      () => getAdditionalJavaArgument(settings.javaArguments),
      {
        title: {
          key: 'server.java.userArguments',
        },
      }
    );
    if (isValid(additionalJavaArgument)) {
      return additionalJavaArgument;
    }
    return [];
  }

  async function serverData() {
    // サーバーデータ準備
    const server = await readyVersion(settings.version, cwdPath);
    // サーバーデータの用意ができなかった場合エラー
    if (isError(server)) return server;

    // 実行javaを用意
    const javaPath = await readyJava(server.component, true);
    // 実行javaが用意できなかった場合エラー
    if (isError(javaPath)) return javaPath;

    return { server, javaPath };
  }

  async function log4jArg() {
    // log4jの設定
    const log4jarg = await getLog4jArg(cwdPath, settings.version, progress);
    // log4jのファイルがダウンロードできなかった場合エラー
    if (isError(log4jarg)) return log4jarg;
    // log4j引数を実行時引数に追加
    if (log4jarg === null) return [];
    return [log4jarg];
  }

  const [memory, user, serverJava, log4j] = await Promise.all([
    memoryArg(),
    userArg(),
    serverData(),
    log4jArg(),
  ]);
  if (isError(serverJava)) return serverJava;
  if (isError(log4j)) return log4j;

  javaArgs.push(...memory, ...user, ...log4j);

  const { server, javaPath } = serverJava;

  // Eulaの同意チェック
  const eulaResult = await assertEula(
    id,
    cwdPath,
    server,
    settings.version,
    javaPath,
    progress
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
  progress: PlainProgressor
) {
  const needEula = needEulaAgreement(version);
  // Eulaチェックが必要かどうかの検証に失敗した場合エラー
  if (isError(needEula)) return needEula;

  if (!needEula) return undefined;

  // Eulaチェック
  const eulaAgreement = await progress.withPlain(
    () => checkEula(id, javaPath, server.programArguments, cwdPath, progress),
    {
      title: {
        key: 'server.eula.title',
      },
    }
  );

  // Eulaチェックに失敗した場合エラー
  if (isError(eulaAgreement)) return eulaAgreement;

  // Eulaに同意しなかった場合エラー
  if (!eulaAgreement) {
    return errorMessage.core.minecraftEULANotAccepted();
  }
}
