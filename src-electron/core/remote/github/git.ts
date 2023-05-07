import {
  Failable,
  failabilify,
  isFailure,
  isSuccess,
} from 'src-electron/api/failable';
import { SimpleGit, simpleGit } from 'simple-git';
import { Path } from 'src-electron/util/path';
import { getGitPat } from './pat';
import { RemoteOperator } from '../base';
import { serverSettingsFileName } from '../../settings/worldJson';
import { LEVEL_NAME } from '../../const';
import { GithubBlob, GithubTree } from './githubApi';
import { worldSettingsToWorld } from '../../settings/converter';
import { GithubRemote } from 'src-electron/schema/remote';
import { World, WorldID, WorldSettings } from 'src-electron/schema/world';
import { WorldContainer, WorldName } from 'app/src-electron/schema/brands';

export const githubRemoteOperator: RemoteOperator<GithubRemote> = {
  pullWorld,
  pushWorld,
  getWorld,
};

const DEFAULT_REMOTE_NAME = 'serverstarter';

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
  remote: GithubRemote,
  pat: string
): Promise<Failable<string>> {
  const url = getRemoteUrl(remote, pat);
  const remotes = await failabilify(() => git.getRemotes(true))();
  if (isFailure(remotes)) return remotes;

  const names = new Set<string>();

  // すでにリモートが存在する場合
  for (const remote of remotes) {
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
  remote: GithubRemote
): Promise<Failable<undefined>> {
  // patを取得
  const pat = await getGitPat(remote.owner, remote.repo);
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
  remote: GithubRemote
): Promise<Failable<undefined>> {
  // ディレクトリが存在しない場合エラー
  if (!local.exists()) {
    return new Error(`unable to push non-existing directory ${local}`);
  }

  // patを取得
  const pat = await getGitPat(remote.owner, remote.repo);
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
  id: WorldID,
  name: WorldName,
  container: WorldContainer,
  remote: GithubRemote
): Promise<Failable<World>> {
  // patを取得
  const pat = await getGitPat(remote.owner, remote.repo);
  // TODO: patが未登録だった場合GUI側で入力待機したほうがいいかも
  if (isFailure(pat)) return pat;

  const root = await GithubTree.fromRepository(
    remote.owner,
    remote.repo,
    remote.branch,
    pat
  );
  if (isFailure(root)) return root;
  const rootFiles = await root.files();
  if (isFailure(rootFiles)) return rootFiles;

  const settingFile = rootFiles[serverSettingsFileName];
  const worldDir = rootFiles[LEVEL_NAME];

  const [settings, avater_path] = await Promise.all([
    getSettings(settingFile),
    getIconURI(worldDir),
  ]);

  if (settings === undefined) {
    return new Error(`failed to load & parse ${settingFile.url}`);
  }

  return worldSettingsToWorld({
    id,
    avater_path,
    container,
    name,
    settings,
  });
}

async function getSettings(settingsFile: GithubTree | GithubBlob) {
  if (settingsFile === undefined) return undefined;
  if (settingsFile instanceof GithubTree) return undefined;
  const json = await settingsFile.loadJson<WorldSettings>();
  if (isFailure(json)) return undefined;
  return json;
}

async function getIconURI(worldDir: GithubTree | GithubBlob) {
  // ディレクトリが存在しない場合
  if (worldDir === undefined) return undefined;

  // ディレクトリでない場合
  if (worldDir instanceof GithubBlob) return undefined;

  // icon.pngを取得
  const files = await worldDir.files();
  if (isFailure(files)) return undefined;
  const iconFile = files['icon.png'];

  // icon.pngが存在しない場合
  if (iconFile === undefined) return undefined;
  // icon.pngがファイルでない場合
  if (iconFile instanceof GithubTree) return undefined;

  // icon.pngの内容を読み込んでdata URIにエンコード
  const bytes = await iconFile.loadBytes();
  if (isFailure(bytes)) return undefined;
  return await bytes.encodeURI('image/png');
}
