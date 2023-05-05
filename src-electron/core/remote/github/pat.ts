import { Failable } from 'src-electron/api/failable';
import { systemSettings } from '../../stores/system';
import { GithubAccountSetting } from 'src-electron/schema/remote';

/** リポジトリを操作できる登録済みのPATを取得する。 */
export async function getGitPat(
  owner: string,
  repo: string
): Promise<Failable<string>> {
  const gitAccounts: GithubAccountSetting[] = systemSettings.get(
    'remote.github.accounts'
  );

  for (const account of gitAccounts) {
    const matchOwner = owner === account.owner;
    const matchRepository = repo === account.repo;
    if (matchOwner && matchRepository) {
      return account.pat;
    }
  }

  return new Error(`missing git personal access token for ${owner}.${repo}`);
}

/** リポジトリを操作できる登録済みのPATを取得する。
 * 既に登録されていた場合更新する。*/
export async function setGitPat(
  owner: string,
  repo: string,
  pat: string
): Promise<undefined> {
  const gitAccounts: GithubAccountSetting[] = systemSettings.get(
    'remote.github.accounts'
  );

  for (const account of gitAccounts) {
    const matchOwner = owner === account.owner;
    const matchRepository = repo === account.repo;
    // 登録済みだった場合は更新して保存
    if (matchOwner && matchRepository) {
      account.pat = pat;
      systemSettings.set('remote.github.accounts', gitAccounts);
      return undefined;
    }
  }
  // 未登録の場合は追加して保存
  gitAccounts.push({ owner, repo, pat });
  systemSettings.set('remote.github.accounts', gitAccounts);
  return undefined;
}
