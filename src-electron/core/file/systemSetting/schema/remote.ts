import { ArrayFixMode, fixArray } from '../../base/fixer/array';
import { fixConst } from '../../base/fixer/const';
import { fixObject } from '../../base/fixer/object';
import { fixString } from '../../base/fixer/primitive';

export type GithubRemoteFolder$1 = {
  type: 'github';
  owner: string;
  repo: string;
};

export const GithubRemoteFolder$1 = fixObject<GithubRemoteFolder$1>({
  type: fixConst('github'),
  owner: fixString,
  repo: fixString,
});

export type GithubRemoteSetting$1 = {
  folder: GithubRemoteFolder$1;
  pat: string;
};

export const GithubRemoteSetting$1 = fixObject<GithubRemoteSetting$1>({
  folder: GithubRemoteFolder$1,
  pat: fixString,
});

export type RemoteSetting$1 = GithubRemoteSetting$1;
export const RemoteSetting$1 = GithubRemoteSetting$1;

export type RemoteSettings$1 = RemoteSetting$1[];
export const RemoteSettings$1 = fixArray(
  RemoteSetting$1,
  ArrayFixMode.Skip
).default([]);
