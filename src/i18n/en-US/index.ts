import { MessageSchema } from 'src/boot/i18n';
import { enUSHome } from 'src/i18n/en-US/Pages/World/home';
import { enUSproperty } from 'src/i18n/en-US/Pages/World/property';
import { enAutoShutdown } from './Dialogs/autoshutdown';
import { enUSEulaDialog } from './Dialogs/eulaDialog';
import { enUSIcon } from './Dialogs/icon';
import { enUSOwner } from './Dialogs/owner';
import { enUSUpdater } from './Dialogs/updater';
import { enWelcome } from './Dialogs/welcome';
import { enUSError } from './Other/error';
import { enUSGeneral } from './Other/general';
import { enTabs } from './Other/tabs';
import { enUSBugReport } from './Pages/bugReport';
import { enUSMainLayout } from './Pages/mainLayout';
import { enUSSystemSetting } from './Pages/systemsetting';
import { enAdditionalContents } from './Pages/World/additionalContents';
import { enUSConsole } from './Pages/World/console';
import { enOthers } from './Pages/World/others';
import { enUSPlayer } from './Pages/World/player';
import { enUSProgress } from './Pages/World/progress';
import { enUSShareWorld } from './Pages/World/shareWorld';

export const enUS: MessageSchema = {
  tabs: enTabs,
  general: enUSGeneral,
  home: enUSHome,
  property: enUSproperty,
  console: enUSConsole,
  player: enUSPlayer,
  systemsetting: enUSSystemSetting,
  bugReport: enUSBugReport,
  additionalContents: enAdditionalContents,
  error: enUSError,
  progress: enUSProgress,
  mainLayout: enUSMainLayout,
  icon: enUSIcon,
  shareWorld: enUSShareWorld,
  updater: enUSUpdater,
  welcome: enWelcome,
  autoshutdown: enAutoShutdown,
  eulaDialog: enUSEulaDialog,
  owner: enUSOwner,
  others: enOthers,
};
