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

export type RemoteFolder$1 = GithubRemoteFolder$1;
export const RemoteFolder$1 = GithubRemoteFolder$1;

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

export type AppRemoteSettings$1 = RemoteSetting$1[];
export const AppRemoteSettings$1 = fixArray(
  RemoteSetting$1,
  ArrayFixMode.Skip
).default([]);

export type Remote$1 = {
  folder: RemoteFolder$1;
  name: string;
};
export const Remote$1 = fixObject({
  folder: RemoteFolder$1,
  name: fixString,
});
