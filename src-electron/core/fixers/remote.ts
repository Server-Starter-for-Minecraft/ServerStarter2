import {
  GithubRemoteFolder,
  GithubRemoteSetting,
  Remote,
  RemoteFolder,
  RemoteSetting,
} from 'app/src-electron/schema/remote';
import {
  FAIL,
  Fixer,
  literalFixer,
  objectFixer,
  stringFixer,
} from 'app/src-electron/util/detaFixer/fixer';

export const fixGithubRemoteFolder = objectFixer<GithubRemoteFolder>(
  {
    type: literalFixer(['github']),
    owner: stringFixer(),
    repo: stringFixer(),
  },
  false
);

// export const fixRemote: Fixer<Remote | FAIL> = fixGithubRemote;

export const fixGithubRemoteSetting = objectFixer<GithubRemoteSetting>(
  {
    folder: fixGithubRemoteFolder,
    pat: stringFixer(),
  },
  false
);

export const fixRemoteFolder: Fixer<RemoteFolder | FAIL> =
  fixGithubRemoteFolder;

export const fixRemoteSetting: Fixer<RemoteSetting | FAIL> =
  fixGithubRemoteSetting;

export const fixRemote = objectFixer<Remote>(
  {
    folder: fixRemoteFolder,
    name: stringFixer(),
  },
  false
);