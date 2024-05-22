export type MinecraftRuntime = {
  type: 'minecraft';
  version: 'runtime_gamma';
};

/**
 * Amazon Coretto を使用する可能性があるので、その対応
 *
 * https://aws.amazon.com/jp/corretto
 */
export type CorrettoRuntime = {
  type: 'corretto';
};

export type Runtime = MinecraftRuntime | CorrettoRuntime;

/** メモリ等ランタイムの設定 */
export type RuntimeSettings =
  | {
      jvmarg: string;
    }
  | {
      memory: [number, 'MB' | 'GB' | 'TB'];
    };
