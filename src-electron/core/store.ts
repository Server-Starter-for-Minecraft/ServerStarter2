import Store from 'electron-store';

export type Config = {
  version_manifest_v2_sha1?: string;
  spigot_buildtool_sha1?: string;
  sha1?: {
    runtime?: string;
  };
};

// const store = new Store({encryptionKey: '7fb0fce6-ea98-48cb-b7d2-989f15ad20e8'})
export const config = new Store<Config>();
