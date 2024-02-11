import { fixObject } from '../base/fixer/object';
import { fixNumber } from '../base/fixer/primitive';

export type AppSystemSettings$1 = {
  // 最終アップデート時刻
  lastUpdatedTime?: number;
};

export const AppSystemSettings$1 = fixObject<AppSystemSettings$1>({
  lastUpdatedTime: fixNumber.optional(),
}).default({});
