import {
  Remote,
  RemoteFolder,
  RemoteSetting,
  RemoteWorld,
} from 'src-electron/schema/remote';
import { GroupProgressor } from 'app/src-electron/common/progress';
import { RemoteWorldName } from 'app/src-electron/schema/brands';
import { WithError } from 'app/src-electron/schema/error';
import { Failable } from 'app/src-electron/util/error/failable';
import { Path } from '../../util/binary/path';

export type RemoteOperator<T extends RemoteFolder> = {
  /** ワールドデータをpull */
  pullWorld(
    local: Path,
    remote: Remote<T>,
    progress?: GroupProgressor
  ): Promise<Failable<undefined>>;

  /** ワールドデータをpush */
  pushWorld(
    local: Path,
    remote: Remote<T>,
    progress?: GroupProgressor
  ): Promise<Failable<undefined>>;

  /** リモートのワールドデータを削除 */
  deleteWorld(remote: Remote<T>): Promise<Failable<undefined>>;

  /** ワールド一覧を取得 */
  getWorlds(remoteFolder: T): Promise<WithError<Failable<RemoteWorld[]>>>;

  /** ワールド名が利用可能かチェック */
  validateNewWorldName(
    remoteFolder: T,
    name: string
  ): Promise<Failable<RemoteWorldName>>;

  /** ワールドフォルダが利用可能かチェック */
  validate(remoteSetting: RemoteSetting): Promise<Failable<RemoteSetting>>;
};
