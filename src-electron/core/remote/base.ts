import { Failable } from 'app/src-electron/util/error/failable';
import { Path } from '../../util/path';
import { Remote, RemoteFolder, RemoteWorld } from 'src-electron/schema/remote';
import { WithError } from 'app/src-electron/schema/error';
import { RemoteWorldName } from 'app/src-electron/schema/brands';

export type RemoteOperator<T extends RemoteFolder> = {
  /** ワールドデータをpull */
  pullWorld(local: Path, remote: Remote<T>): Promise<Failable<undefined>>;

  /** ワールドデータをpush */
  pushWorld(local: Path, remote: Remote<T>): Promise<Failable<undefined>>;

  /** ワールド一覧を取得 */
  getWorlds(remoteFolder: T): Promise<WithError<Failable<RemoteWorld[]>>>;

  /** ワールド名が利用可能かチェック */
  validateNewWorldName(
    remoteFolder: T,
    name: string
  ): Promise<Failable<RemoteWorldName>>;
};
