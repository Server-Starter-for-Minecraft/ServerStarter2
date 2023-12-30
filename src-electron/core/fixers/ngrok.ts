import { NgrokSetting } from "app/src-electron/schema/ngrok";
import { Fixer, booleanFixer, objectFixer, optionalFixer, stringFixer } from "app/src-electron/util/detaFixer/fixer";

export const ngrokSettingFixer: Fixer<NgrokSetting> = objectFixer({
    useNgrok: booleanFixer(true),
    remote_addr: optionalFixer(stringFixer())
}, true)