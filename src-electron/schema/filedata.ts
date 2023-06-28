import { WorldID } from './world';

/** ワールドに保存されたmod/plugin/datapackのデータを表す */
export type WorldFileData<T extends Record<string, any>> = T & {
  type: 'world';
  id: WorldID;
  name: string;
  ext: string;
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
};

/** システムにキャッシュされたmod/plugin/datapackのデータ */
export type SystemFileData<T extends Record<string, any>> = T & {
  type: 'system';
  name: string;
  ext: string;
};

export type AllFileData<T extends Record<string, any>> =
  | WorldFileData<T>
  | NewFileData<T>
  | SystemFileData<T>;

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
  name: string;
  path: string;
};
