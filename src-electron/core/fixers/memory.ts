import { MemorySettings, MemoryUnit } from 'app/src-electron/schema/memory';
import {
  literalFixer,
  numberFixer,
  objectFixer,
} from 'app/src-electron/util/detaFixer/fixer';

export const fixMemoryUnit = literalFixer<MemoryUnit>([
  'B',
  'KB',
  'MB',
  'GB',
  'TB',
  '',
  'K',
  'M',
  'G',
  'T',
]);

export const fixMemorySettings = objectFixer<MemorySettings>(
  {
    size: numberFixer(),
    unit: fixMemoryUnit,
  },
  false
);
