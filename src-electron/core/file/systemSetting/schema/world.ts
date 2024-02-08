import { DEFAULT_SERVER_PROPERTIES } from 'app/src-electron/core/const';
import { fixConst } from '../../base/fixer/const';
import { fixObject } from '../../base/fixer/object';
import { fixBoolean, fixNumber, fixString } from '../../base/fixer/primitive';
import { fixRecord } from '../../base/fixer/record';
import { fixUnion } from '../../base/fixer/union';

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

export const MemoryUnit$1 = fixConst<MemoryUnit$1>(
  'B',
  'KB',
  'MB',
  'GB',
  'TB',
  '',
  'K',
  'M',
  'G',
  'T'
);

export type MemorySettings$1 = {
  size: number;
  unit: MemoryUnit$1;
};
export const defaultMemorySettings$1: MemorySettings$1 = {
  size: 2,
  unit: 'GB',
};
export const MemorySettings$1 = fixObject<MemorySettings$1>({
  size: fixNumber.default(defaultMemorySettings$1.size),
  unit: MemoryUnit$1.default(defaultMemorySettings$1.unit),
});

/** サーバープロパティのデータ */
export type ServerProperties$1 = {
  [key in string]: string | number | boolean;
};
export const ServerProperties$1 = fixRecord(
  fixUnion(fixNumber, fixBoolean, fixString)
);

/** serverstarterのシステム設定内のワールド設定 */
export type AppWorldSettings$1 = {
  /** Javaの実行時引数 */
  javaArguments?: string;

  memory: MemorySettings$1;

  properties: ServerProperties$1;
};

export const defaultAppWorldSettings$1: AppWorldSettings$1 = {
  javaArguments: undefined,

  memory: {
    size: 2,
    unit: 'GB',
  },

  properties: DEFAULT_SERVER_PROPERTIES,
};

export const AppWorldSettings$1 = fixObject<AppWorldSettings$1>({
  javaArguments: fixString.optional(),

  memory: MemorySettings$1.default(defaultAppWorldSettings$1.memory),

  properties: ServerProperties$1.default(defaultAppWorldSettings$1.properties),
}).default(defaultAppWorldSettings$1);
