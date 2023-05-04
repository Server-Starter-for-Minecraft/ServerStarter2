export type GithubRemote = {
  type: 'github';
  owner: string;
  repo: string;
  branch: string;
};

export type Remote = GithubRemote;

export type GithubAccountSetting = {
  owner: string;
  repo: string;
  pat: string;
};

export type GithubRemoteSetting = {
  accounts: GithubAccountSetting[];
};
