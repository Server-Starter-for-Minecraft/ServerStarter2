export type SystemRemoteSetting = RemoteSettings$1[];

export type GithubRemoteFolder$1 = {
  type: 'github';
  owner: string;
  repo: string;
};

export type GithubRemoteSetting$1 = {
  folder: GithubRemoteFolder$1;
  pat: string;
};

export type RemoteSettings$1 = GithubRemoteSetting$1;
