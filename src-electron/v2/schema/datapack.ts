import { NewType } from './newtype';

export type DatapackHash = NewType<string, 'DatapackHash'>;
export type DatapackName = NewType<string, 'DatapackName'>;

export type ZipDatapack = {
  isZip: true;
  name: DatapackName;
  hash: DatapackHash;
};

export type DirectoryDomain = {
  isZip: false;
  name: DatapackName;
};

export type DatapackDomain = ZipDatapack | DirectoryDomain;
