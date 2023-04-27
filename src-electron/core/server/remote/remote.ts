import { Remote, World } from 'src-electron/api/schema';
import { RemoteOperator } from './base';
import { gitRemoteOperator } from './github/git';
import { Path } from '../../utils/path/path';
import { Failable } from 'src-electron/api/failable';


export const remoteOperators: {
  [R in Remote as R['type']]: RemoteOperator<Remote>;
} = {
  github: gitRemoteOperator,
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
  return await loader.getWorld(name,container, remote);
}
