import { MessageSchema } from "src/boot/i18n";
import { enUSHome } from "src/i18n/en-US/World/home";
import { enUSproperty } from "src/i18n/en-US/World/property";
import { enUSConsole } from "./World/console";
import { enUSPlayer } from "./World/player";
import { enUSSystemSetting } from "./Other/systemsetting";
import { enUSUtils } from "./Other/utils";
import { enAdditionalContents } from "./World/additionalContents";
import { enUSError } from "./Other/error";
import { enUSProgress } from "./World/progress";
import { enUSWorldList } from "./Other/worldList";
import { enUSIcon } from "./Dialogs/icon";
import { enUSShareWorld } from "./World/shareWorld";
import { enWelcome } from "./Dialogs/welcome";
import { enAutoShutdown } from "./Dialogs/autoshutdown";
import { enUSGeneral } from "./Other/general";
import { enUSEulaDialog } from "./Dialogs/eulaDialog";
import { enUSOwner } from "./Dialogs/owner";
import { enOthers } from "./World/others";
import { enRecoverDialog } from "./Dialogs/recoverDialog";

export const enUS: MessageSchema = {
  general: enUSGeneral,
  home: enUSHome,
  property: enUSproperty,
  console: enUSConsole,
  player: enUSPlayer,
  systemsetting: enUSSystemSetting,
  utils: enUSUtils,
  additionalContents: enAdditionalContents,
  error: enUSError,
  progress: enUSProgress,
  worldList: enUSWorldList,
  icon: enUSIcon,
  shareWorld: enUSShareWorld,
  welcome: enWelcome,
  autoshutdown: enAutoShutdown,
  eulaDialog: enUSEulaDialog,
  owner: enUSOwner,
  others: enOthers,
  recoverDialog: enRecoverDialog
};
