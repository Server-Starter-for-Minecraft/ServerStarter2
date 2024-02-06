import { fixObject } from '../../base/fixer/object';
import { fixNumber } from '../../base/fixer/primitive';

export type SystemSettings$1 = {
  // 最終アップデート時刻
  lastUpdatedTime?: number;
};

export const SystemSettings$1 = fixObject<SystemSettings$1>({
  lastUpdatedTime: fixNumber.optional(),
}).default({});
