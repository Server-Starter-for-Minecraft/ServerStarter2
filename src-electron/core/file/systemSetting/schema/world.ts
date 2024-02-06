/** serverstarterのシステム設定内のワールド設定 */
export type WorldSettings$1 = {
  /** Javaの実行時引数 */
  javaArguments?: string;

  memory: MemorySettings$1;

  properties: ServerProperties$1;
};

export type MemoryUnit$1 =
  | 'B'
  | 'KB'
  | 'MB'
  | 'GB'
  | 'TB'
  | ''
  | 'K'
  | 'M'
  | 'G'
  | 'T';

export type MemorySettings$1 = {
  size: number;
  unit: MemoryUnit$1;
};

/** サーバープロパティのデータ */
export type ServerProperties$1 = {
  [key in string]: string | number | boolean;
};
