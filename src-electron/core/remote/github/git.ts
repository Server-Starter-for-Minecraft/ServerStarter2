import { simpleGit } from 'simple-git';
import { Path } from 'src-electron/util/path';
import { getGitPat } from './pat';
import { RemoteOperator } from '../base';
import { GithubRemote } from 'src-electron/schema/remote';
import {
  fromRuntimeError,
  isError,
  isValid,
} from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/schema/error';
import { getSystemSettings } from '../../stores/system';
import { getPlayerFromUUID } from '../../player/main';

export const githubRemoteOperator: RemoteOperator<GithubRemote> = {
  pullWorld,
  pushWorld,
};

const DEFAULT_REMOTE_NAME = 'serverstarter';

// TODO: ログの追加

function getRemoteUrl(remote: GithubRemote) {
  // githubでないホストを使用していた場合エラー
  return `https://github.com/${remote.owner}/${remote.repo}`;
}

// SimpleGitインスタンスを取得
async function setupGit(local: Path, remote: GithubRemote) {
  // patを取得
  // TODO: patが未登録だった場合GUI側で入力待機したほうがいいかも
  const pat = await getGitPat(remote.owner, remote.repo);

  if (isError(pat)) return pat;
  
  const url = getRemoteUrl(remote);
  // ディレクトリがなければ作成
  await local.mkdir(true);

  // SimpleGitインスタンスを作成
  const git = simpleGit(local.str(), {
    config: [
      `http.${url}.extraheader=Authorization: Basic ${Buffer.from(
        `${remote.owner}:${pat}`
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

async function pullWorld(
  local: Path,
  remote: GithubRemote
): Promise<Failable<undefined>> {
  const git = await setupGit(local, remote);
  if (isError(git)) return git;

  try {
    await git.fetch(DEFAULT_REMOTE_NAME, remote.branch);
    // リモートの内容をチェックアウト
    await git.checkout(`${DEFAULT_REMOTE_NAME}/${remote.branch}`,["-f"]);
  } catch (e: any) {
    if (e.message === `fatal: couldn't find remote ref ${remote.branch}\n`) {
      // ブランチが存在しない場合何もせず終了
      return;
    } else {
      return fromRuntimeError(e);
    }
  }
}

async function pushWorld(
  local: Path,
  remote: GithubRemote
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
  await git.commit('TEST MESSAGE');
  await git.push([DEFAULT_REMOTE_NAME, `HEAD:${remote.branch}`, '-f']);
}
