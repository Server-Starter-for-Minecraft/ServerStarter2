import {
  GithubAccountSetting,
  GithubRemote,
  GithubRemoteSetting,
  Remote,
} from 'app/src-electron/schema/remote';
import {
  FAIL,
  Fixer,
  arrayFixer,
  literalFixer,
  objectFixer,
  stringFixer,
} from 'app/src-electron/util/detaFixer/fixer';

export const fixGithubRemote = objectFixer<GithubRemote>(
  {
    type: literalFixer(['github']),
    owner: stringFixer(),
    repo: stringFixer(),
    branch: stringFixer(),
  },
  false
);

export const fixRemote: Fixer<Remote | FAIL> = fixGithubRemote;

export const fixGithubAccountSetting = objectFixer<GithubAccountSetting>(
  {
    owner: stringFixer(),
    repo: stringFixer(),
    pat: stringFixer(),
  },
  false
);

export const fixGithubRemoteSetting = objectFixer<GithubRemoteSetting>(
  {
    accounts: arrayFixer(fixGithubAccountSetting, true),
  },
  false
);
