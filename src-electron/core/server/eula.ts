import { api } from '../api';
import { Path } from '../../util/path';
import { Failable, isFailure } from '../../api/failable';
import { execProcess } from '../../util/subprocess';
import { WorldId } from 'app/src-electron/schema/world';

/**
 * Eulaに同意したかどうかを返す
 *
 * Eula.txtが存在しなかった場合Eulaを生成
 * eula=falseだった場合ユーザーに同意を求める
 */
export async function checkEula(
  javaPath: Path,
  programArgunets: string[],
  serverCwdPath: Path,
  worldId: WorldId
): Promise<Failable<boolean>> {
  const eulaPath = serverCwdPath.child('eula.txt');

  // eula.txtが存在しない場合生成
  if (!eulaPath.exists()) {
    const result = await generateEula(
      javaPath,
      programArgunets,
      serverCwdPath,
      worldId
    );
    // 生成に失敗した場合エラー
    if (isFailure(result)) return result;
  }
  // eulaの内容を読み取る
  const content = await eulaPath.read();
  if (isFailure(content)) return content;

  const { eula, url, comments } = parseEula(await content.text());
  let agree = eula;

  if (!agree) {
    agree = await api.invoke.AgreeEula(worldId, url);
  }

  const txt = stringifyEula(agree, comments);

  // eulaの内容を書き込む
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
  worldId: WorldId
): Promise<Failable<undefined>> {
  api.send.UpdateStatus(worldId, 'eula.txtを生成中');

  const eulaPath = serverCwdPath.child('eula.txt');

  // サーバーを仮起動
  const result = await execProcess(
    javaPath.absolute().str(),
    [...programArgunets, '--nogui'],
    serverCwdPath.absolute().str(),
    true
  );

  if (isFailure(result)) {
    return new Error('failed to generate eula.txt.');
  }

  if (!eulaPath.exists()) {
    return new Error('failed to generate eula.txt.');
  }
}
