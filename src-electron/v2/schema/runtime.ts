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
