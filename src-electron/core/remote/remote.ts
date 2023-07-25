import { RemoteOperator } from './base';
import { githubRemoteOperator } from './github/git';
import { Path } from 'src-electron/util/path';
import { Remote, RemoteFolder, RemoteWorld } from 'src-electron/schema/remote';
import { Failable, WithError } from 'app/src-electron/schema/error';
import { RemoteWorldName } from 'app/src-electron/schema/brands';

export const remoteOperators: {
  [K in RemoteFolder as K['type']]: RemoteOperator<K>;
} = {
  github: githubRemoteOperator,
};

// ワールドのデータをpull
export async function pullRemoteWorld<T extends RemoteFolder>(
  local: Path,
  remote: Remote<T>
): Promise<Failable<undefined>> {
  const loader: RemoteOperator<T> = remoteOperators[remote.folder.type];
  return await loader.pullWorld(local, remote);
}

// ワールドのデータをpush
export async function pushRemoteWorld<T extends RemoteFolder>(
  local: Path,
  remote: Remote<T>
): Promise<Failable<undefined>> {
  const loader: RemoteOperator<T> = remoteOperators[remote.folder.type];
  return await loader.pushWorld(local, remote);
}

// リモートのワールド一覧を取得
export function getRemoteWorlds<T extends RemoteFolder>(
  remoteFolder: T
): Promise<WithError<Failable<RemoteWorld[]>>> {
  const loader: RemoteOperator<T> = remoteOperators[remoteFolder.type];
  return loader.getWorlds(remoteFolder);
}

// リモートのワールド一覧を取得
export function deleteRemoteWorld<T extends RemoteFolder>(
  remote: Remote<T>
): Promise<Failable<undefined>> {
  const loader: RemoteOperator<T> = remoteOperators[remote.folder.type];
  return loader.deleteWorld(remote);
}

// リモートのワールド一覧を取得
export function validateNewRemoteWorldName<T extends RemoteFolder>(
  remoteFolder: T,
  name: string
): Promise<Failable<RemoteWorldName>> {
  const loader: RemoteOperator<T> = remoteOperators[remoteFolder.type];
  return loader.validateNewWorldName(remoteFolder, name);
}
