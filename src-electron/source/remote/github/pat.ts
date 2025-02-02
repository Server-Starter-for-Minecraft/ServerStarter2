import { GithubRemoteSetting } from 'src-electron/schema/remote';
import { Failable } from 'app/src-electron/schema/error';
import { errorMessage } from 'app/src-electron/util/error/construct';
import {
  getSystemSettings,
  setSystemSettings,
} from '../../../source/stores/system';

/** リポジトリを操作できる登録済みのPATを取得する。 */
export async function getGitPat(
  owner: string,
  repo: string
): Promise<Failable<string>> {
  const sysSettings = await getSystemSettings();
  const gitAccounts: GithubRemoteSetting[] = sysSettings.remote.filter(
    (x) => x.folder.type === 'github'
  );

  for (const account of gitAccounts) {
    const matchOwner = owner === account.folder.owner;
    const matchRepository = repo === account.folder.repo;
    if (matchOwner && matchRepository) {
      return account.pat;
    }
  }

  return errorMessage.core.missingPersonalAccessToken({
    owner,
    repo,
  });
}

/** リポジトリを操作できる登録済みのPATを取得する。
 * 既に登録されていた場合更新する。*/
export async function setGitPat(
  owner: string,
  repo: string,
  pat: string
): Promise<undefined> {
  const systemSettings = await getSystemSettings();

  for (const remote of systemSettings.remote) {
    if (remote.folder.type !== 'github') continue;
    const matchOwner = owner === remote.folder.owner;
    const matchRepository = repo === remote.folder.repo;
    // 登録済みだった場合は更新して保存
    if (matchOwner && matchRepository) {
      remote.pat = pat;
      await setSystemSettings(systemSettings);
      return undefined;
    }
  }

  // 未登録の場合は追加して保存
  systemSettings.remote.push({ folder: { owner, repo, type: 'github' }, pat });

  await setSystemSettings(systemSettings);
  return undefined;
}
