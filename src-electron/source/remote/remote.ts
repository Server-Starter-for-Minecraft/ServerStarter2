import {
  Remote,
  RemoteFolder,
  RemoteSetting,
  RemoteWorld,
} from 'src-electron/schema/remote';
import { Path } from 'src-electron/util/path';
import { RemoteWorldName } from 'app/src-electron/schema/brands';
import { Failable, WithError } from 'app/src-electron/schema/error';
import { GroupProgressor } from '../progress/progress';
import { RemoteOperator } from './base';
import { githubRemoteOperator } from './github/git';

export const remoteOperators: {
  [K in RemoteFolder as K['type']]: RemoteOperator<K>;
} = {
  github: githubRemoteOperator,
};

// ワールドのデータをpull
export async function pullRemoteWorld<T extends RemoteFolder>(
  local: Path,
  remote: Remote<T>,
  progress?: GroupProgressor
): Promise<Failable<undefined>> {
  const loader = remoteOperators[remote.folder.type] as RemoteOperator<T>;
  return await loader.pullWorld(local, remote, progress);
}

// ワールドのデータをpush
export async function pushRemoteWorld<T extends RemoteFolder>(
  local: Path,
  remote: Remote<T>,
  progress?: GroupProgressor
): Promise<Failable<undefined>> {
  const loader = remoteOperators[remote.folder.type] as RemoteOperator<T>;
  return await loader.pushWorld(local, remote, progress);
}

// リモートのワールド一覧を取得
export function getRemoteWorlds<T extends RemoteFolder>(
  remoteFolder: T
): Promise<WithError<Failable<RemoteWorld[]>>> {
  const loader = remoteOperators[remoteFolder.type] as RemoteOperator<T>;
  return loader.getWorlds(remoteFolder);
}

// リモートのワールド一覧を取得
export function deleteRemoteWorld<T extends RemoteFolder>(
  remote: Remote<T>
): Promise<Failable<undefined>> {
  const loader = remoteOperators[remote.folder.type] as RemoteOperator<T>;
  return loader.deleteWorld(remote);
}

// リモートのワールド一覧を取得
export function validateNewRemoteWorldName<T extends RemoteFolder>(
  remoteFolder: T,
  name: string
): Promise<Failable<RemoteWorldName>> {
  const loader = remoteOperators[remoteFolder.type] as RemoteOperator<T>;
  return loader.validateNewWorldName(remoteFolder, name);
}

// リモートフォルダの存在を確認
export function validateRemoteSetting(
  remoteSetting: RemoteSetting
): Promise<Failable<RemoteSetting>> {
  const loader = remoteOperators[remoteSetting.folder.type];
  return loader.validate(remoteSetting);
}
