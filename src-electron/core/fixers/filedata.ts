import { FileData, NewData } from 'app/src-electron/schema/filedata';
import {
  objectFixer,
  optionalFixer,
  stringFixer,
  unionFixer,
} from 'app/src-electron/util/detaFixer/fixer';

/** mod/plugin/datapackのデータを表す */
export const fixFileData = objectFixer<FileData>(
  {
    name: stringFixer(),
    description: optionalFixer(stringFixer()),
  },
  false
);

/** 新しく追加する際のmod/plugin/datapackのデータを表す */
export const fixNewData = objectFixer<NewData>(
  {
    name: stringFixer(),
    path: stringFixer(),
    description: optionalFixer(stringFixer()),
  },
  false
);

export const fixFileOrNewData = unionFixer(fixFileData, fixNewData);
