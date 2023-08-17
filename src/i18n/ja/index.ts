// This is just an example,
// so you can safely delete all default props below
import { jaProperty } from "src/i18n/ja/property"
import { jaHome } from "src/i18n/ja/home"
import { jaConsole } from "./console";
import { jaPlayer } from "./player";
import { jaSystemSetting } from "./systemsetting";
import { jaUtils } from "./utils";
import { jaAdditionalContents } from "./additionalContents";
import { jaError } from "./error";
import { jaProgress } from "./progress";
import { jaWorldList } from "./worldList";
import { jaIcon } from "./icon";
import { jaShareWorld } from "./shareWorld";
import { jaWelcome } from "./welcome";
import { jaAutoShutdown } from "./autoshutdown";
import { jaGeneral } from "./general";
import { jaEulaDialog } from "./eulaDialog";
import { jaOwner } from "./owner";

export const ja = {
  general: jaGeneral,
  home: jaHome,
  property: jaProperty,
  console: jaConsole,
  player: jaPlayer,
  systemsetting: jaSystemSetting,
  utils: jaUtils,
  additionalContents: jaAdditionalContents,
  error: jaError,
  progress: jaProgress,
  worldList: jaWorldList,
  icon: jaIcon,
  shareWorld: jaShareWorld,
  welcome: jaWelcome,
  autoshutdown: jaAutoShutdown,
  eulaDialog: jaEulaDialog,
  owner: jaOwner,
};