import {
  Failable,
  failabilify,
  isFailure,
  isSuccess,
} from 'src-electron/api/failable';
import { SimpleGit, simpleGit } from 'simple-git';
import {
  GitRemote,
  GithubRemote,
  World,
  WorldSettings,
} from 'src-electron/api/schema';
import { Path } from 'src-electron/core/utils/path/path';
import { getGitPat } from './pat';
import { RemoteOperator } from '../base';
import { fetchGithubFiles } from './githubApi';
import { server_settings_file_name } from '../../world/worldJson';

export const gitRemoteOperator: RemoteOperator<GitRemote> = {
  pullWorld,
  pushWorld,
  getWorld,
};

const DEFAULT_REMOTE_NAME = 'serversterter';

// TODO: ログの追加

function getRemoteUrl(remote: GithubRemote, pat: string) {
  // githubでないホストを使用していた場合エラー
  return `https://${remote.owner}:${pat}@github.com/${remote.owner}/${remote.repo}`;
}

async function isGitRipository(git: SimpleGit, local: Path) {
  const topLevelStr = await failabilify((...args) => git.revparse(...args))([
    '--show-toplevel',
  ]);
  if (isFailure(topLevelStr)) return topLevelStr;
  const topLevel = new Path(topLevelStr);
  return topLevel.str() === local.str();
}

/**
 * 該当するリモートの名称を取得する
 * 該当するリモートが無ければ新しく追加する
 */
async function getRemoteName(
  git: SimpleGit,
  remote: GitRemote,
  pat: string
): Promise<Failable<string>> {
  const url = getRemoteUrl(remote, pat);
  const remotes = await failabilify(() => git.getRemotes(true))();
  if (isFailure(remotes)) return remotes;

  const names = new Set<string>();

  // すでにリモートが存在する場合
  for (let remote of remotes) {
    const matchFetch = remote.refs.fetch === url;
    const matchPush = remote.refs.push === url;
    if (matchFetch && matchPush) return remote.name;
    names.add(remote.name);
  }

  // 新しくリモートを登録する
  // リモート名を決定
  let remotename = DEFAULT_REMOTE_NAME;
  let i = 0;
  while (names.has(remotename)) {
    remotename = `${DEFAULT_REMOTE_NAME}${i}`;
    i += 1;
  }

  const result = await failabilify(() => git.addRemote(remotename, url))();
  if (isFailure(result)) result;

  return remotename;
}

async function pullWorld(
  local: Path,
  remote: GitRemote
): Promise<Failable<undefined>> {
  // githubでないホストを使用していた場合エラー
  if (remote.host !== 'github')
    return new Error(`server starter not correspond with host:${remote.host}`);

  // patを取得
  const pat = getGitPat(remote.owner, remote.repo);
  // TODO: patが未登録だった場合GUI側で入力待機したほうがいいかも
  if (isFailure(pat)) return pat;

  // ディレクトリが存在しない場合生成
  if (!local.exists()) local.mkdir(true);

  const git = simpleGit(local.str());
  const exists = await isGitRipository(git, local);
  if (exists) {
    // 該当のリモート名称を取得
    const remoteName = await getRemoteName(git, remote, pat);
    // 該当のリモート名称の取得に成功した場合
    if (isSuccess(remoteName)) {
      // pullを実行
      const pullResult = await failabilify(() =>
        git.pull(remoteName, remote.branch)
      )();
      // pullに成功した場合
      if (isSuccess(pullResult)) return undefined;
    }
  }

  // うまくいかなかった場合ディレクトリを消してclone
  await local.remove(true);
  await local.mkdir();

  // cloneを実行
  const url = getRemoteUrl(remote, pat);
  const cloneOptions = [
    '-b',
    remote.branch,
    '-o',
    DEFAULT_REMOTE_NAME,
    '--single-branch',
    '--depth=1',
  ];
  const cloneResult = await failabilify(() =>
    git.clone(url, local.str(), cloneOptions)
  )();

  if (isFailure(cloneResult)) return cloneResult;

  return undefined;
}

async function pushWorld(
  local: Path,
  remote: GitRemote
): Promise<Failable<undefined>> {
  // githubでないホストを使用していた場合エラー
  if (remote.host !== 'github')
    return new Error(`server starter not correspond with host:${remote.host}`);

  // ディレクトリが存在しない場合エラー
  if (!local.exists()) {
    return new Error(`unable to push non-existing directory ${local}`);
  }

  // patを取得
  const pat = getGitPat(remote.owner, remote.repo);
  // TODO: patが未登録だった場合GUI側で入力待機したほうがいいかも
  if (isFailure(pat)) return pat;

  const git = simpleGit(local.str());

  const exists = await isGitRipository(git, local);

  // gitリポジトリだった場合
  if (exists) {
    // 該当のリモート名称を取得
    const remoteName = await getRemoteName(git, remote, pat);
    // 該当のリモート名称の取得に成功した場合
    if (isSuccess(remoteName)) {
      // pushを実行
      const pushResult = await failabilify(() =>
        git.push(remoteName, remote.branch)
      )();
      // pushに成功した場合
      if (isSuccess(pushResult)) return undefined;
    }
  }

  // .gitディレクトリを削除
  const gitPath = local.child('.git');
  if (gitPath.exists()) await gitPath.remove();

  // git init
  const initResult = await failabilify(() =>
    git.init(['-b', DEFAULT_REMOTE_NAME])
  )();
  if (isFailure(initResult)) return initResult;

  // git commit
  const commitResult = await failabilify(() =>
    git.commit('message', undefined, { '-a': null })
  )();
  if (isFailure(commitResult)) return commitResult;

  // git push
  const pushResult = await failabilify(() =>
    git.push(DEFAULT_REMOTE_NAME, remote.branch)
  )();
  if (isFailure(pushResult)) return pushResult;

  return undefined;
}

async function getWorld(
  name: string,
  container: string,
  remote: GitRemote
): Promise<Failable<World>> {
  // githubでないホストを使用していた場合エラー
  if (remote.host !== 'github')
    return new Error(`server starter not correspond with host:${remote.host}`);

  // patを取得
  const pat = getGitPat(remote.owner, remote.repo);
  // TODO: patが未登録だった場合GUI側で入力待機したほうがいいかも
  if (isFailure(pat)) return pat;

  // ワールド設定のjsonの内容を取得
  const [settingFile, avatarFile] = await fetchGithubFiles(
    remote.owner,
    remote.repo,
    remote.branch,
    [server_settings_file_name, 'world/icon.png'],
    pat
  );
  if (isFailure(settingFile)) return settingFile;

  const json = await settingFile.json<WorldSettings>();
  if (isFailure(json)) return json;

  let avater_path: undefined | string = undefined;

  if (isSuccess(avatarFile)) {
    avater_path = await avatarFile.encodeURI('image/png');
  }

  return {
    avater_path,
    name: name,
    container: container,
    settings: json,
    additional: {},
  };
}
