import {
  Remote,
  RemoteFolder,
  RemoteSetting,
  RemoteWorld,
} from 'src-electron/schema/remote';
import { GroupProgressor } from 'app/src-electron/common/progress';
import { RemoteWorldName } from 'app/src-electron/schema/brands';
import { Failable, WithError } from 'app/src-electron/schema/error';
import { Path } from 'app/src-electron/util/binary/path';
import { RemoteOperator } from './base';
import { githubRemoteOperator } from './github/git';

/**
 * リモートの種類ごとの操作
 *
 * リモートの種類が 1 つ（GitHub）のため，各関数は種類で操作を引くだけで型が合う。
 * 種類を追加すると，引いた操作の型が種類の和になり型が合わなくなるため，種類から操作を引く関数を用意すること
 */
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
  const loader = remoteOperators[remote.folder.type];
  return loader.pullWorld(local, remote, progress);
}

// ワールドのデータをpush
export async function pushRemoteWorld<T extends RemoteFolder>(
  local: Path,
  remote: Remote<T>,
  progress?: GroupProgressor
): Promise<Failable<undefined>> {
  const loader = remoteOperators[remote.folder.type];
  return loader.pushWorld(local, remote, progress);
}

// リモートのワールド一覧を取得
export async function getRemoteWorlds<T extends RemoteFolder>(
  remoteFolder: T
): Promise<WithError<Failable<RemoteWorld[]>>> {
  const loader = remoteOperators[remoteFolder.type];
  return loader.getWorlds(remoteFolder);
}

// リモートのワールド一覧を取得
export async function deleteRemoteWorld<T extends RemoteFolder>(
  remote: Remote<T>
): Promise<Failable<undefined>> {
  const loader = remoteOperators[remote.folder.type];
  return loader.deleteWorld(remote);
}

// リモートのワールド一覧を取得
export async function validateNewRemoteWorldName<T extends RemoteFolder>(
  remoteFolder: T,
  name: string
): Promise<Failable<RemoteWorldName>> {
  const loader = remoteOperators[remoteFolder.type];
  return loader.validateNewWorldName(remoteFolder, name);
}

// リモートフォルダの存在を確認
export async function validateRemoteSetting(
  remoteSetting: RemoteSetting
): Promise<Failable<RemoteSetting>> {
  const loader = remoteOperators[remoteSetting.folder.type];
  return loader.validate(remoteSetting);
}
