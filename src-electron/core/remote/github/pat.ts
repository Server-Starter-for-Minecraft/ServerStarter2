import { Failable } from 'src-electron/api/failable';
import {
  REMOTES_KEY,
  serverStarterSetting,
} from 'src-electron/core/stores/setting';

/** リポジトリを操作できる登録済みのPATを取得する。 */
export function getGitPat(owner: string, repo: string): Failable<string> {
  const gitAccounts =
    serverStarterSetting.get(REMOTES_KEY)?.github?.accounts ?? [];

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
export function setGitPat(owner: string, repo: string, pat: string): undefined {
  const gitAccounts =
    serverStarterSetting.get(REMOTES_KEY)?.github?.accounts ?? [];

  for (const account of gitAccounts) {
    const matchOwner = owner === account.owner;
    const matchRepository = repo === account.repo;
    // 登録済みだった場合は更新して保存
    if (matchOwner && matchRepository) {
      account.pat = pat;
      serverStarterSetting.set(REMOTES_KEY, gitAccounts);
      return undefined;
    }
  }
  // 未登録の場合は追加して保存
  gitAccounts.push({ owner, repo, pat });
  serverStarterSetting.set(REMOTES_KEY, gitAccounts);
  return undefined;
}
