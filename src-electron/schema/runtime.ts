import { z } from 'zod';

export const JavaMajorVersion = z.number().brand('JavaMajorVersion');
export type JavaMajorVersion = z.infer<typeof JavaMajorVersion>;

/**
 * MinecraftがサポートするJavaのバージョンリスト
 */
export const JavaComponent = z.enum([
  'java-runtime-alpha',
  'java-runtime-beta',
  'java-runtime-gamma',
  'java-runtime-delta',
  'jre-legacy',
]);
export type JavaComponent = z.infer<typeof JavaComponent>;

// minecraftのデフォルトのランタイム
export const MinecraftRuntime = z.object({
  type: z.literal('minecraft'),
  /**
   * 'jre-legacy'
   * 'java-runtime-alpha'
   * 'java-runtime-beta'
   * 'java-runtime-gamma'
   * 'java-runtime-delta';
   */
  version: JavaComponent,
});
export type MinecraftRuntime = z.infer<typeof MinecraftRuntime>;

// バージョンだけを指定するランタイム
// 実際は MinecraftRuntime か CorrettoRuntime かになる
export type UniversalRuntime = {
  type: 'universal';
  majorVersion: JavaMajorVersion;
};

/**
 * Amazon Coretto で提供されているランタイム (未使用)
 *
 * https://aws.amazon.com/jp/corretto
 */
export type CorrettoRuntime = {
  type: 'corretto';
  majorVersion: JavaMajorVersion;
};

export type Runtime = MinecraftRuntime | UniversalRuntime; // | CorrettoRuntime

/** メモリ等ランタイムの設定 */
export const RuntimeSettings = z.union([
  z.object({ jvmarg: z.string() }),
  z.object({ memory: z.tuple([z.number(), z.enum(['MB', 'GB', 'TB'])]) }),
]);
export type RuntimeSettings = z.infer<typeof RuntimeSettings>;

// Manifest
const McRuntimeVerManifest = z.object({
  manifest: z.object({
    sha1: z.string(),
    size: z.number(),
    url: z.string(),
  }),
});
const McOsManifest = z.record(
  z.string(),
  z.array(McRuntimeVerManifest).optional()
);
export const McRuntimeManifest = z.object({
  linux: McOsManifest,
  'mac-os': McOsManifest,
  'mac-os-arm64': McOsManifest,
  'windows-x64': McOsManifest,
  'windows-arm64': McOsManifest,
});
export type McRuntimeManifest = z.infer<typeof McRuntimeManifest>;

// Correttoは未実装
export const CorrettoRuntimeManifest = z.object({});
export type CorrettoRuntimeManifest = z.infer<typeof CorrettoRuntimeManifest>;

/**
 * 各Runtimeの取得に使用するManifestの型定義
 */
const AllRuntimeManifests = z.object({
  minecraft: McRuntimeManifest,
  corretto: CorrettoRuntimeManifest,
});
export type AllRuntimeManifests = z.infer<typeof AllRuntimeManifests>;

type Keys<T> = keyof T;
type Values<T extends Record<string, z.ZodType>> = z.infer<T[Keys<T>]>;
export type RuntimeManifest = Values<typeof AllRuntimeManifests.shape>;
