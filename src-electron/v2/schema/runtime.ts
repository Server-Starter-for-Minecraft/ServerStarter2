export const minecraftRuntimeVersions = [
  'jre-legacy',
  'java-runtime-alpha',
  'java-runtime-beta',
  'java-runtime-gamma',
  'java-runtime-delta',
] as const;

// Javaバージョンの指定がなかった時に使用する最も古いランタイム
// minecraftRuntimeにおける`jre-legacy`に該当？
export const oldestMajorVersion = 8;

// minecraftのデフォルトのランタイム
export type MinecraftRuntime = {
  type: 'minecraft';
  version: (typeof minecraftRuntimeVersions)[number];
};

// バージョンだけを指定するランタイム
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
export type RuntimeSettings =
  | {
      jvmarg: string;
    }
  | {
      memory: [number, 'MB' | 'GB' | 'TB'];
    };
