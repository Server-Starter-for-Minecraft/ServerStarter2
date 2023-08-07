// This is just an example,
// so you can safely delete all default props below
import { MessageSchema } from "src/boot/i18n";
import { enUSHome } from "src/i18n/en-US/home";
import { enUSproperty } from "src/i18n/en-US/property";
import { enUSConsole } from "./console";
import { enUSPlayer } from "./player";
import { enUSSystemSetting } from "./systemsetting";
import { enUSUtils } from "./utils";
import { enAdditionalContents } from "./additionalContents";
import { enUSError } from "./error";
import { enUSProgress } from "./progress";
import { enUSWorldList } from "./worldList";
import { enUSIcon } from "./icon";
import { enUSShareWorld } from "./shareWorld";
import { enWelcome } from "./welcome";
import { enAutoShutdown } from "./autoshutdown";

export const enUS: MessageSchema = {
  home:enUSHome,
  property:enUSproperty,
  console:enUSConsole,
  player:enUSPlayer,
  systemsetting:enUSSystemSetting,
  utils:enUSUtils,
  additionalContents:enAdditionalContents,
  error:enUSError,
  progress:enUSProgress,
  worldList:enUSWorldList,
  icon:enUSIcon,
  shareWorld:enUSShareWorld,
  welcome:enWelcome,
  autoshutdown:enAutoShutdown,
};
