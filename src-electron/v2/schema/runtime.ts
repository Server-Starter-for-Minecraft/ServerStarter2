import { z } from 'zod';

export const JavaMajorVersion = z.number().brand('JavaMajorVersion');
export type JavaMajorVersion = z.infer<typeof JavaMajorVersion>;

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
  version: z.string(),
});
export type MinecraftRuntime = z.infer<typeof MinecraftRuntime>;

// バージョンだけを指定するランタイム
// 実際は MinecraftRuntime か CorrettoRuntime かになる

export const UniversalRuntime = z.object({
  type: z.literal('universal'),
  majorVersion: JavaMajorVersion,
});

export type UniversalRuntime = z.infer<typeof UniversalRuntime>;

/**
 * Amazon Coretto で提供されているランタイム (未使用)
 *
 * https://aws.amazon.com/jp/corretto
 */
export type CorrettoRuntime = {
  type: 'corretto';
  majorVersion: JavaMajorVersion;
};

export const Runtime = z.discriminatedUnion('type', [
  MinecraftRuntime,
  UniversalRuntime,
  // CorrettoRuntime
]);
export type Runtime = z.infer<typeof Runtime>;

/** メモリ等ランタイムの設定 */
export const RuntimeSettings = z.union([
  z.object({ jvmarg: z.string() }),
  z.object({ memory: z.tuple([z.number(), z.enum(['MB', 'GB', 'TB'])]) }),
]);
export type RuntimeSettings = z.infer<typeof RuntimeSettings>;
