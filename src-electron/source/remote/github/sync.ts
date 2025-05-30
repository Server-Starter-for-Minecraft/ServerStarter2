import { simpleGit, SimpleGitProgressEvent } from 'simple-git';
import { Remote } from 'src-electron/schema/remote';
import { GroupProgressor } from 'app/src-electron/common/progress';
import { Failable } from 'app/src-electron/schema/error';
import { Path } from 'app/src-electron/util/binary/path';
import {
  fromRuntimeError,
  isError,
  isValid,
} from 'app/src-electron/util/error/error';
import { safeExecAsync } from 'app/src-electron/util/error/failable';
import { sleep } from 'app/src-electron/util/promise/sleep';
import { gitTempPath } from '../../../source/const';
import { getSystemSettings } from '../../../source/stores/system';
import { getPlayerFromUUID } from '../../player/main';
import { getSystemOwnerName } from '../../player/owner';
import { getGitPat } from './pat';

function logger(): [
  (func: (arg: SimpleGitProgressEvent) => void) => void,
  (arg: SimpleGitProgressEvent) => void
] {
  let _func: (arg: SimpleGitProgressEvent) => void;
  function set(func: (arg: SimpleGitProgressEvent) => void) {
    _func = func;
  }
  function invoke(arg: SimpleGitProgressEvent) {
    _func?.(arg);
  }
  return [set, invoke];
}

const DEFAULT_REMOTE_NAME = 'serverstarter';

// TODO: ログの追加

function getRemoteUrl(remote: Remote) {
  // githubでないホストを使用していた場合エラー
  return `https://github.com/${remote.folder.owner}/${remote.folder.repo}`;
}

// SimpleGitインスタンスを取得
async function setupGit(local: Path, remote: Remote) {
  // プログレス周りの処理
  const [set, invoke] = logger();

  // patを取得
  // TODO: patが未登録だった場合GUI側で入力待機したほうがいいかも
  const pat = await getGitPat(remote.folder.owner, remote.folder.repo);

  if (isError(pat)) return [pat, set] as const;

  const url = getRemoteUrl(remote);
  // ディレクトリがなければ作成
  await local.mkdir(true);

  // SimpleGitインスタンスを作成
  const git = simpleGit(local.str(), {
    config: [
      `http.${url}.extraheader=Authorization: Basic ${Buffer.from(
        `${remote.name}:${pat}`
      ).toString('base64')}`,
    ],
    progress: invoke,
  });

  try {
    // ローカルリポジトリに指定のリモートが登録されているかをチェック
    const remoteUrl = await git.remote(['get-url', DEFAULT_REMOTE_NAME]);
    if (remoteUrl !== url) {
      // 他のリモートURLが登録されていた場合URLを更新
      await git.remote(['set-url', DEFAULT_REMOTE_NAME, url]);
    }
  } catch (e) {
    // TODO: エラーの種類によって分岐すべき
    // リモートが登録されていない場合新しく登録
    // initは空打ちになる可能性あり
    await git.init();
    await git.remote(['add', DEFAULT_REMOTE_NAME, url]);
  }

  let i = 0;
  while (i < 100) {
    i++;
    try {
      await git.addConfig(
        'user.name',
        (await getSystemOwnerName()) ?? '<ANONYMOUS>',
        undefined,
        'local'
      );
      await git.addConfig('user.email', '', undefined, 'local');
      break;
    } catch (e) {
      await sleep(100);
    }
  }

  return [git, set] as const;
}

export async function pullWorld(
  local: Path,
  remote: Remote,
  progress?: GroupProgressor
): Promise<Failable<undefined>> {
  progress?.title({ key: 'server.pull.title' });
  const [git, set] = await setupGit(local, remote);
  if (isError(git)) return git;

  if (progress) {
    const stage = progress.subtitle({ key: 'server.pull.ready' });
    const numeric = progress.numeric('file');
    set((x) => {
      stage.subtitle = {
        key: 'server.pull.stage',
        args: { stage: x.stage },
      };
      numeric.max = x.total;
      numeric.value = x.processed;
    });
  }
  try {
    await git.fetch(DEFAULT_REMOTE_NAME, remote.name);
    // リモートの内容をチェックアウト
    await git.checkout(`${DEFAULT_REMOTE_NAME}/${remote.name}`, ['-f']);
  } catch (e: any) {
    if (e.message === `fatal: couldn't find remote ref ${remote.name}\n`) {
      // ブランチが存在しない場合何もせず終了
      return;
    } else {
      return fromRuntimeError(e);
    }
  }
}

export async function pushWorld(
  local: Path,
  remote: Remote,
  progress?: GroupProgressor
): Promise<Failable<undefined>> {
  progress?.title({ key: 'server.push.title' });
  const [git, onGitProgress] = await setupGit(local, remote);
  if (isError(git)) return git;

  const sys = await getSystemSettings();
  const uuid = sys.user.owner;

  let message: string;

  if (uuid !== undefined) {
    // UUIDからプレイヤー検索
    const sub = progress?.subtitle({
      key: 'server.remote.desc.getPlayerFromUUID',
      args: { uuid: uuid },
    });
    const player = await getPlayerFromUUID(uuid);
    sub?.delete();
    if (isValid(player)) message = `${player.name}`;
    else message = `<UNKNOWN_PLAYER>(${uuid})`;
  } else message = '<ANONYMOUS>';

  await git.add('-A');
  await git.commit(message, undefined, { '--allow-empty': null });

  // pushのプログレスを反映
  if (progress) {
    const stage = progress.subtitle({ key: 'server.push.ready' });
    const numeric = progress.numeric('file');
    onGitProgress((x) => {
      stage.subtitle = {
        key: 'server.push.stage',
        args: { stage: x.stage },
      };
      numeric.max = x.total;
      numeric.value = x.processed;
    });
  }
  await safeExecAsync(() =>
    git.push([DEFAULT_REMOTE_NAME, `HEAD:${remote.name}`, '-f'])
  );
}

export async function deleteWorld(
  remote: Remote
): Promise<Failable<undefined>> {
  // 一時フォルダ内で実行
  await gitTempPath.mkdir(true);

  const pat = await getGitPat(remote.folder.owner, remote.folder.repo);

  const url = getRemoteUrl(remote);

  const git = simpleGit(gitTempPath.str(), {
    config: [
      `http.${url}.extraheader=Authorization: Basic ${Buffer.from(
        `${remote.name}:${pat}`
      ).toString('base64')}`,
    ],
  });

  await git.init();

  // リモートのブランチを削除
  const push = await safeExecAsync(() => git.push(url, `:${remote.name}`));

  // 一時フォルダを削除（削除失敗がユーザーに影響しないため無視）
  await gitTempPath.remove();

  // pushに失敗した場合
  if (isError(push)) return push;
}
