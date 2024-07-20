import { z } from 'zod';

// minecraftのデフォルトのランタイム
export type MinecraftRuntime = {
  type: 'minecraft';
  version:
    | 'jre-legacy'
    | 'java-runtime-alpha'
    | 'java-runtime-beta'
    | 'java-runtime-gamma'
    | 'java-runtime-delta';
};

// バージョンだけを指定するランタイム
// 実際は MinecraftRuntime か CorrettoRuntime かになる
export type UniversalRuntime = {
  type: 'universal';
  majorVersion: number;
};

/**
 * Amazon Coretto で提供されているランタイム (未使用)
 *
 * https://aws.amazon.com/jp/corretto
 */
export type CorrettoRuntime = {
  type: 'corretto';
  majorVersion: number;
};

export type Runtime = MinecraftRuntime | UniversalRuntime; // | CorrettoRuntime

/** メモリ等ランタイムの設定 */
export const RuntimeSettings = z.union([
  z.object({ jvmarg: z.string() }),
  z.object({ memory: z.tuple([z.number(), z.enum(['MB', 'GB', 'TB'])]) }),
]);
export type RuntimeSettings = z.infer<typeof RuntimeSettings>;
