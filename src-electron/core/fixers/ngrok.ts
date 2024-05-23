import { NgrokSetting } from 'app/src-electron/schema/ngrok';
import {
  booleanFixer,
  Fixer,
  objectFixer,
  optionalFixer,
  stringFixer,
} from 'app/src-electron/util/detaFixer/fixer';

export const ngrok_settingFixer: Fixer<NgrokSetting> = objectFixer(
  {
    use_ngrok: booleanFixer(false),
    remote_addr: optionalFixer(stringFixer()),
  },
  true
);
