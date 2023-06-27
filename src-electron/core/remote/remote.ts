import { RemoteOperator } from './base';
import { Failable } from 'src-electron/api/failable';
import { githubRemoteOperator } from './github/git';
import { Path } from 'src-electron/util/path';
import { Remote } from 'src-electron/schema/remote';

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