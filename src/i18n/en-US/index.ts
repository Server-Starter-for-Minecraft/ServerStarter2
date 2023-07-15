// This is just an example,
// so you can safely delete all default props below
import { MessageSchema } from "src/boot/i18n";
import { enUSHome } from "src/i18n/en-US/home";
import { enUSproperty } from "src/i18n/en-US/property";
import { enUSConsole } from "./console";
import { enUSPlayer } from "./player";
import { enUSSystemSetting } from "./systemsetting";

export const enUS: MessageSchema = {
  home:enUSHome,
  property:enUSproperty,
  console:enUSConsole,
  player:enUSPlayer,
  systemsettings:enUSSystemSetting
};
