import { Remote, World } from 'src-electron/api/schema_old';
import { RemoteOperator } from './base';
import { Failable } from 'src-electron/api/failable';
import { githubRemoteOperator } from './github/git';
import { Path } from 'src-electron/util/path';

export const remoteOperators: {
  [R in Remote as R['type']]: RemoteOperator<Remote>;
} = {
  github: githubRemoteOperator,
};

// ワールドのデータをpull
export async function pullRemoteWorld<R extends Remote>(
  local: Path,
  remote: R
): Promise<Failable<undefined>> {
  const loader: RemoteOperator<R> = remoteOperators[
    remote.type
  ] as RemoteOperator<R>;
  return await loader.pullWorld(local, remote);
}

// ワールドのデータをpush
export async function pushRemoteWorld<R extends Remote>(
  local: Path,
  remote: R
): Promise<Failable<undefined>> {
  const loader: RemoteOperator<R> = remoteOperators[
    remote.type
  ] as RemoteOperator<R>;
  return await loader.pushWorld(local, remote);
}

// ワールドの設定を読み込む
export async function getRemoteWorld<R extends Remote>(
  name: string,
  container: string,
  remote: R
): Promise<Failable<World>> {
  const loader: RemoteOperator<R> = remoteOperators[
    remote.type
  ] as RemoteOperator<R>;
  return await loader.getWorld(name, container, remote);
}
