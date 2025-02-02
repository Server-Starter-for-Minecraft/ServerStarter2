import { ImageURI, RemoteWorldName } from 'app/src-electron/schema/brands';
import {
  ErrorMessage,
  Failable,
  WithError,
} from 'app/src-electron/schema/error';
import {
  GithubRemoteFolder,
  RemoteWorld,
} from 'app/src-electron/schema/remote';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { withError } from 'app/src-electron/util/error/witherror';
import { asyncMap } from 'app/src-electron/util/objmap';
import { LEVEL_NAME } from '../../../source/const';
import {
  WORLD_SETTINGS_PATH,
  WorldSettings,
} from '../../../source/world/files/json';
import { getGithubBranches, GithubBlob, GithubTree } from './githubApi';
import { getGitPat } from './pat';

export async function getWorlds(
  remoteFolder: GithubRemoteFolder
): Promise<WithError<Failable<RemoteWorld[]>>> {
  const pat = await getGitPat(remoteFolder.owner, remoteFolder.repo);
  if (isError(pat)) return withError(pat);

  const branches = await getGithubBranches(
    remoteFolder.owner,
    remoteFolder.repo,
    pat
  );
  if (isError(branches)) return withError(branches);

  const worlds = await asyncMap(branches, (branch) =>
    getWorld(remoteFolder.owner, remoteFolder.repo, branch, pat)
  );
  return withError(worlds.filter(isValid), worlds.filter(isError));
}

export async function getWorld(
  owner: string,
  repo: string,
  branch: string,
  pat: string
): Promise<Failable<RemoteWorld>> {
  const tree = await GithubTree.fromRepository(owner, repo, branch, pat);
  if (isError(tree)) return tree;

  const serverFiles = await tree.files();
  if (isError(serverFiles)) return serverFiles;
  const worldTree = serverFiles[LEVEL_NAME];
  if (!(worldTree instanceof GithubTree)) {
    return errorMessage.data.githubAPI.invalidWorldData({
      owner,
      repo,
      branch,
    });
  }

  const worldFiles = await worldTree.files();
  if (isError(worldFiles)) return worldFiles;

  const error = errorMessage.data.githubAPI.invalidWorldData({
    owner,
    repo,
    branch,
  });

  const json = await getWorldJson(serverFiles[WORLD_SETTINGS_PATH], error);
  const icon = await getWorldIcon(worldFiles['icon.png'], error);
  if (isError(json)) return json;

  return {
    remote: {
      folder: {
        owner,
        repo,
        type: 'github',
      },
      name: branch as RemoteWorldName,
    },
    version: json.version,
    using: json.using,
    last_date: json.last_date,
    last_user: json.last_user,
    avater_path: isValid(icon) ? icon : undefined,
    ngrok_setting: json.ngrok_setting,
  };
}

async function getWorldJson(
  maybeGithubBlob: GithubBlob | GithubTree | undefined,
  error: ErrorMessage
): Promise<Failable<WorldSettings>> {
  if (!(maybeGithubBlob instanceof GithubBlob)) return error;

  const json = await maybeGithubBlob.loadJson();
  return json;
}

async function getWorldIcon(
  maybeGithubBlob: GithubBlob | GithubTree | undefined,
  error: ErrorMessage
): Promise<Failable<ImageURI>> {
  if (!(maybeGithubBlob instanceof GithubBlob)) return error;

  const bytes = await maybeGithubBlob.loadBytes();
  if (isError(bytes)) return bytes;
  return bytes.encodeURI('image/png');
}
