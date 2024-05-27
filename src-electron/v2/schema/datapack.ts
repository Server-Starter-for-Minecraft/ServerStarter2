import { NewType } from '../util/type/newtype';

export type DatapackHash = NewType<string, 'DatapackHash'>;
export type DatapackName = NewType<string, 'DatapackName'>;

export type ZipDatapack = {
  /** Zipかどうか */
  isZip: true;
  /** データパック名称 */
  name: DatapackName;
  /** データパックhash */
  hash: DatapackHash;
  /** データが存在するか */
  exists: boolean;
};

export type DirectoryDatapack = {
  /** Zipかどうか */
  isZip: false;
  /** データパック名称 */
  name: DatapackName;
  /** データが存在するか */
  exists: boolean;
};

export type Datapack = ZipDatapack | DirectoryDatapack;
