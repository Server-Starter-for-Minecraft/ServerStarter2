export type ZipDatapack = {
  isZip: true;
  name: string;
  hash: string;
};

export type DirectoryDomain = {
  isZip: false;
  name: string;
};

export type DatapackDomain = ZipDatapack | DirectoryDomain;
