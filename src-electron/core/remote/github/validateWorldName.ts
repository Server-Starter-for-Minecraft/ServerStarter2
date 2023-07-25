import { Failable } from 'app/src-electron/schema/error';
import { GithubRemoteFolder } from 'app/src-electron/schema/remote';
import { getGithubBranches } from './githubApi';
import { getGitPat } from './pat';
import { isError } from 'app/src-electron/util/error/error';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { RemoteWorldName } from 'app/src-electron/schema/brands';

export async function validateWorldName(
  remoteFolder: GithubRemoteFolder,
  name: string
): Promise<Failable<RemoteWorldName>> {
  const worldNameRegex = /^[a-zA-Z0-9_-]+$/;
  if (name.match(worldNameRegex) === null)
    return errorMessage.value.remoteWorldName.notMatchRegex({
      value: name,
    });

  const pat = await getGitPat(remoteFolder.owner, remoteFolder.repo);
  if (isError(pat)) return pat;

  const branches = await getGithubBranches(
    remoteFolder.owner,
    remoteFolder.repo,
    pat
  );
  if (isError(branches)) return branches;
  const lowerName = name.toLowerCase();

  const contains = branches.some((x) => x.toLowerCase() === lowerName);

  if (contains) {
    return errorMessage.value.remoteWorldName.alreadyUsed({
      value: name,
    });
  }

  return name as RemoteWorldName;
}
