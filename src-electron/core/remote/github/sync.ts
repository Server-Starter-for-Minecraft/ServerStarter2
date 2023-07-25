import { simpleGit } from 'simple-git';
import { Path } from 'src-electron/util/path';
import { getGitPat } from './pat';
import { GithubRemoteFolder, Remote } from 'src-electron/schema/remote';
import {
  fromRuntimeError,
  isError,
  isValid,
} from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/schema/error';
import { getSystemSettings } from '../../stores/system';
import { getPlayerFromUUID } from '../../player/main';

const DEFAULT_REMOTE_NAME = 'serverstarter';

// TODO: ログの追加

function getRemoteUrl(remote: Remote<GithubRemoteFolder>) {
  // githubでないホストを使用していた場合エラー
  return `https://github.com/${remote.folder.owner}/${remote.folder.repo}`;
}

// SimpleGitインスタンスを取得
async function setupGit(local: Path, remote: Remote<GithubRemoteFolder>) {
  // patを取得
  // TODO: patが未登録だった場合GUI側で入力待機したほうがいいかも
  const pat = await getGitPat(remote.folder.owner, remote.folder.repo);

  if (isError(pat)) return pat;

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

  return git;
}

export async function pullWorld(
  local: Path,
  remote: Remote<GithubRemoteFolder>
): Promise<Failable<undefined>> {
  const git = await setupGit(local, remote);
  if (isError(git)) return git;

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
  remote: Remote<GithubRemoteFolder>
): Promise<Failable<undefined>> {
  const git = await setupGit(local, remote);
  if (isError(git)) return git;

  const sys = await getSystemSettings();
  const uuid = sys.user.owner;

  let message: string;
  const player = await getPlayerFromUUID(uuid);
  if (isValid(player)) message = `${player.name}(${uuid})`;
  else message = `<ANONYMOUS>(${uuid})`;

  await git.add('-A');
  await git.commit(message);
  await git.push([DEFAULT_REMOTE_NAME, `HEAD:${remote.name}`, '-f']);
}
