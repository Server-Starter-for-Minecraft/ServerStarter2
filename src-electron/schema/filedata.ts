import { ImageURI } from './brands';
import { WorldID } from './world';

/** ワールドに保存されたmod/plugin/datapackのデータを表す */
export type WorldFileData<T extends Record<string, any>> = T & {
  type: 'world';
  id: WorldID;
  name: string;
  ext: string;
  isFile: boolean;
};

/** 新しく導入する際のmod/plugin/datapackのデータを表す */
export type NewFileData<T extends Record<string, any>> = T & {
  type: 'new';
  // 拡張子のないファイル名称
  name: string;
  // 拡張子
  ext: string;
  // 完全絶対パス
  path: string;
  // ファイルorディレクトリ
  isFile: boolean;
};

/** システムにキャッシュされたmod/plugin/datapackのデータ */
export type CacheFileData<T extends Record<string, any>> = T & {
  type: 'system';
  name: string;
  ext: string;
  isFile: boolean;
};

export type AllFileData<T extends Record<string, any>> =
  | WorldFileData<T>
  | NewFileData<T>
  | CacheFileData<T>;

/** Datapackのデータ */
export type DatapackData = {
  kind: 'datapack';
  description: string;
};

/** Pluginのデータ */
export type PluginData = {
  kind: 'plugin';
};

/** Modのデータ */
export type ModData = {
  kind: 'mod';
};

/** Modのデータ */
export type CustomMapData = {
  kind: 'map';
  path: string;
  isFile: boolean;
  levelName: string;
  icon?: ImageURI;
  // level.dat の中身の Data.Version.Name の値 バニラの時しか意味ないかも? TODO: 要検証
  versionName: string;
};

/** 画像データ(ImageURI) */
export type ImageURIData = {
  kind: 'image';
  path: string;
  data: ImageURI;
};
