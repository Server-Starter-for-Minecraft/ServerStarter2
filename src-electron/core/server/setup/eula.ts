import { api } from '../../api';
import { Path } from '../../../util/path';
import { Failable } from '../../../util/error/failable';
import { execProcess, interactiveProcess } from '../../../util/subprocess';
import { WorldID } from 'app/src-electron/schema/world';
import { isError } from 'app/src-electron/util/error/error';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { GroupProgressor } from '../../progress/progress';
import { Version } from 'app/src-electron/schema/version';
import { sleep } from 'app/src-electron/util/sleep';

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
  progress: GroupProgressor,
  version: Version
): Promise<Failable<boolean>> {
  const eulaPath = serverCwdPath.child('eula.txt');

  // eula.txtが存在しない場合生成
  if (!eulaPath.exists()) {
    const sub = progress.subtitle({
      key: 'server.eula.generating',
    });
    const result = await generateEula(
      javaPath,
      programArgunets,
      serverCwdPath,
      version
    );
    sub.delete();
    // 生成に失敗した場合エラー
    if (isError(result)) return result;
  }
  // eulaの内容を読み取る

  const sub = progress.subtitle({
    key: 'server.eula.loading',
  });
  const content = await eulaPath.read();

  if (isError(content)) {
    sub.delete();
    return content;
  }

  const { eula, url, comments } = parseEula(await content.text());
  sub.delete();

  let agree = eula;

  if (!agree) {
    const sub = progress.subtitle({
      key: 'server.eula.asking',
    });
    const result = await api.invoke.AgreeEula(worldId, url);
    sub.delete();

    // mainWindowが存在しなかった場合エラーとなる
    if (isError(result)) return result;
    agree = result;
  }

  const txt = stringifyEula(agree, comments);

  const saveSub = progress.subtitle({
    key: 'server.eula.saving',
  });
  // eulaの内容を書き込む
  await eulaPath.writeText(txt);
  saveSub.delete();

  return agree;
}

function stringifyEula(agree: boolean, comments: string[]): string {
  return `${comments.join('\n')}\neula=${agree}`;
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
  version: Version
): Promise<Failable<undefined>> {
  const eulaPath = serverCwdPath.child('eula.txt');

  // mohistmcはeula.txtを生成して終了しないためこちらで生成してしまう
  if (version.type === 'mohistmc') {
    await eulaPath.writeText('eula=false');
    return;
  }

  // サーバーを仮起動
  const process = interactiveProcess(
    javaPath,
    [...programArgunets, '--nogui'],
    (value) => {
      if (value.match('Failed to load eula.txt')) {
        process.kill();
      }
    },
    () => {},
    serverCwdPath,
    true
  );

  // 60秒経っても終了していない場合はプロセスキル
  (async () => {
    await sleep(60 * 1000);
    if (!process.finished()) process.kill();
  })();

  const result = await process;

  if (isError(result)) return result;

  if (!eulaPath.exists()) {
    return errorMessage.data.path.creationFiled({
      type: 'file',
      path: eulaPath.path,
    });
  }
}
