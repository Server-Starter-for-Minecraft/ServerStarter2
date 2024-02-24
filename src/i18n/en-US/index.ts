import { MessageSchema } from 'src/boot/i18n';
import { enUSHome } from 'src/i18n/en-US/Pages/World/home';
import { enUSproperty } from 'src/i18n/en-US/Pages/World/property';
import { enUSConsole } from './Pages/World/console';
import { enUSPlayer } from './Pages/World/player';
import { enUSSystemSetting } from './Pages/systemsetting';
import { enUSBugReport } from './Pages/bugReport';
import { enAdditionalContents } from './Pages/World/additionalContents';
import { enUSError } from './Other/error';
import { enUSProgress } from './Pages/World/progress';
import { enUSMainLayout } from './Pages/mainLayout';
import { enUSIcon } from './Dialogs/icon';
import { enUSShareWorld } from './Pages/World/shareWorld';
import { enWelcome } from './Dialogs/welcome';
import { enAutoShutdown } from './Dialogs/autoshutdown';
import { enUSGeneral } from './Other/general';
import { enUSEulaDialog } from './Dialogs/eulaDialog';
import { enUSOwner } from './Dialogs/owner';
import { enOthers } from './Pages/World/others';
import { enTabs } from './Other/tabs';

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
  welcome: enWelcome,
  autoshutdown: enAutoShutdown,
  eulaDialog: enUSEulaDialog,
  owner: enUSOwner,
  others: enOthers,
};
