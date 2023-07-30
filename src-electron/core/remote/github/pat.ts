import { getSystemSettings, systemSettings } from '../../stores/system';
import { GithubRemoteSetting } from 'src-electron/schema/remote';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { Failable } from 'app/src-electron/schema/error';

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
  const gitAccounts: GithubRemoteSetting[] = systemSettings.get(
    'remote.github.accounts'
  );

  for (const account of gitAccounts) {
    const matchOwner = owner === account.folder.owner;
    const matchRepository = repo === account.folder.repo;
    // 登録済みだった場合は更新して保存
    if (matchOwner && matchRepository) {
      account.pat = pat;
      systemSettings.set('remote.github.accounts', gitAccounts);
      return undefined;
    }
  }
  // 未登録の場合は追加して保存
  gitAccounts.push({ folder: { owner, repo, type: 'github' }, pat });
  systemSettings.set('remote.github.accounts', gitAccounts);
  return undefined;
}
