/**
 * TODO: 最終的にはこのファイルは削除して，各リソース別のコード構造に変更
 */
import { z } from 'zod';
import { ImageURI, Timestamp } from './brands';
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
export const DatapackData = z.object({
  kind: z.literal('datapack'),
  description: z.string(),
});
export type DatapackData = z.infer<typeof DatapackData>;

/** Pluginのデータ */
export const PluginData = z.object({
  kind: z.literal('plugin'),
});
export type PluginData = z.infer<typeof PluginData>;

/** Modのデータ */
export const ModData = z.object({
  kind: z.literal('mod'),
});
export type ModData = z.infer<typeof ModData>;

/** 配布マップのデータ */
export const CustomMapData = z.object({
  kind: z.literal('map'),
  path: z.string(),
  isFile: z.boolean(),
  levelName: z.string(),
  icon: ImageURI.optional(),
  /** level.dat の中身の Data.Version.Name の値 バニラの時しか意味ないかも? TODO: 要検証 */
  versionName: z.string(),
  /** レベルが最後にロードされたUnix時間(ミリ秒) */
  lastPlayed: z.number(),
  /** ゲームモード */
  gamemode: z.union([
    z.literal('survival'),
    z.literal('creative'),
    z.literal('adventure'),
    z.literal('spectator'),
  ]),
  /** ハードコア */
  hardcore: z.boolean(),
  /** difficulty */
  difficulty: z.union([
    z.literal('peaceful'),
    z.literal('easy'),
    z.literal('normal'),
    z.literal('hard'),
  ]),
});
export type CustomMapData = z.infer<typeof CustomMapData>;

/** バックアップデータ */
export const BackupData = z.object({
  kind: z.literal('backup'),
  path: z.string(),
  /** ワールド名 */
  name: z.string(),
  /** 作成日時(読み取れない可能性あり) */
  time: Timestamp.optional(),
});
export type BackupData = z.infer<typeof BackupData>;

/** 画像データ(ImageURI) */
export const ImageURIData = z.object({
  kind: z.literal('image'),
  path: z.string(),
  data: ImageURI,
});
export type ImageURIData = z.infer<typeof ImageURIData>;
