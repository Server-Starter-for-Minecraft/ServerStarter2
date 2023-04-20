import { api } from '../api';
import { Path } from '../utils/path/path';
import { Failable, isFailure } from '../utils/result';
import { execProcess } from '../utils/subprocess';

/**
 * Eulaに同意したかどうかを返す
 *
 * Eula.txtが存在しなかった場合Eulaを生成
 * eula=falseだった場合ユーザーに同意を求める
 */
export async function checkEula(
  javaPath: Path,
  programArgunets: string[],
  serverCwdPath: Path
): Promise<Failable<boolean>> {
  const eulaPath = serverCwdPath.child('eula.txt');

  // eula.txtが存在しない場合生成
  if (!eulaPath.exists()) {
    const result = await generateEula(javaPath, programArgunets, serverCwdPath);
    // 生成に失敗した場合エラー
    if (isFailure(result)) return result;
  }
  // eulaの内容を読み取る
  const content = await eulaPath.read();
  if (isFailure(content)) return content;

  const eulaParsed = parseEula(await content.text());
  let agree = eulaParsed[0];
  const comments = eulaParsed[1];

  if (!agree) {
    agree = await api.invoke.AgreeEula();
  }

  const txt = stringifyEula(agree, comments);

  // eulaの内容を書き込む
  await eulaPath.writeText(txt);

  return agree;
}

function stringifyEula(agree: boolean, comments: string[]): string {
  return comments.join('\n') + `\neula=${agree}`;
}

function parseEula(txt: string): [boolean, string[]] {
  const comments: string[] = [];
  let eula = false;
  txt.split('\n').forEach((line) => {
    if (line[0] === '#') {
      comments.push(line);
      return;
    }
    const match = line.toLowerCase().match(/\s*eula\s*=\s*(\w+)\s*/);
    if (match) {
      eula = match[1] === 'true';
    }
  });
  return [eula, comments];
}

async function generateEula(
  javaPath: Path,
  programArgunets: string[],
  serverCwdPath: Path
): Promise<Failable<undefined>> {
  const eulaPath = serverCwdPath.child('eula.txt');

  // サーバーを仮起動
  await execProcess(
    javaPath.absolute().str(),
    [...programArgunets, '--nogui'],
    serverCwdPath.absolute().str(),
    true
  );

  if (!eulaPath.exists()) {
    return new Error('failed to generate eula.txt.');
  }
}
