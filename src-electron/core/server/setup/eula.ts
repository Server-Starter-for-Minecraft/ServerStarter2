import { api } from '../../api';
import { Path } from '../../../util/path';
import { Failable } from '../../../util/error/failable';
import { execProcess } from '../../../util/subprocess';
import { WorldID } from 'app/src-electron/schema/world';
import { isError } from 'app/src-electron/util/error/error';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { PlainProgressor } from '../../progress/progress';
import { deleted } from 'app/src-electron/schema/progress';

/**
 * Eulaに同意したかどうかを返す
 *
 * Eula.txtが存在しなかった場合Eulaを生成
 * eula=falseだった場合ユーザーに同意を求める
 */
export async function checkEula(
  worldId: WorldID,
  javaPath: Path,
  programArgunets: string[],
  serverCwdPath: Path,
  progress: PlainProgressor
): Promise<Failable<boolean>> {
  const eulaPath = serverCwdPath.child('eula.txt');

  // eula.txtが存在しない場合生成
  if (!eulaPath.exists()) {
    progress.description = {
      key: 'server.eula.generating',
    };
    const result = await generateEula(
      javaPath,
      programArgunets,
      serverCwdPath,
      worldId
    );
    progress.description = deleted;
    // 生成に失敗した場合エラー
    if (isError(result)) return result;
  }
  // eulaの内容を読み取る

  progress.description = {
    key: 'server.eula.loading',
  };
  const content = await eulaPath.read();

  if (isError(content)) return content;

  const { eula, url, comments } = parseEula(await content.text());
  let agree = eula;

  if (!agree) {
    progress.description = {
      key: 'server.eula.asking',
    };
    const result = await api.invoke.AgreeEula(worldId, url);
    // mainWindowが存在しなかった場合エラーとなる
    if (isError(result)) return result;
    agree = result;
  }

  const txt = stringifyEula(agree, comments);

  // eulaの内容を書き込む
  progress.description = {
    key: 'server.eula.saving',
  };
  await eulaPath.writeText(txt);

  return agree;
}

function stringifyEula(agree: boolean, comments: string[]): string {
  return comments.join('\n') + `\neula=${agree}`;
}

function parseEula(txt: string): {
  eula: boolean;
  url: string;
  comments: string[];
} {
  const comments: string[] = [];
  let eula = false;
  let url = 'https://aka.ms/MinecraftEULA';
  txt.split('\n').forEach((line) => {
    if (line[0] === '#') {
      // eulaのURLを見つけたら更新
      const match = line.match(/https?:\/\/[^)]+/);
      if (match) url = match[0];
      comments.push(line);
      return;
    }
    const match = line.toLowerCase().match(/\s*eula\s*=\s*(\w+)\s*/);
    if (match) {
      eula = match[1] === 'true';
    }
  });
  return { eula, url, comments };
}

async function generateEula(
  javaPath: Path,
  programArgunets: string[],
  serverCwdPath: Path,
  worldId: WorldID
): Promise<Failable<undefined>> {
  const eulaPath = serverCwdPath.child('eula.txt');

  // サーバーを仮起動
  const result = await execProcess(
    javaPath.absolute().str(),
    [...programArgunets, '--nogui'],
    serverCwdPath.absolute().str(),
    true
  );

  if (isError(result)) return result;

  if (!eulaPath.exists()) {
    return errorMessage.data.path.creationFiled({
      type: 'file',
      path: eulaPath.path,
    });
  }
}
