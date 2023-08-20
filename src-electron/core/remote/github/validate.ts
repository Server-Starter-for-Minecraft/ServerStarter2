import { Failable } from 'app/src-electron/schema/error';
import {
  GithubRemoteFolder,
  GithubRemoteSetting,
  RemoteSetting,
} from 'app/src-electron/schema/remote';
import { getGithubBranches } from './githubApi';
import { getGitPat } from './pat';
import { isError } from 'app/src-electron/util/error/error';

/** リモートにアクセス可能かを確認する */
export async function validate(
  remoteSetting: GithubRemoteSetting
): Promise<Failable<GithubRemoteSetting>> {
  const branches = await getGithubBranches(
    remoteSetting.folder.owner,
    remoteSetting.folder.repo,
    remoteSetting.pat
  );
  if (isError(branches)) return branches;

  return remoteSetting;
}
