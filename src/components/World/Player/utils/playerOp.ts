import { isValid } from 'app/src-public/scripts/error';
import { OpLevel } from 'app/src-electron/schema/player';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';

const mainStore = useMainStore();
const consoleStore = useConsoleStore();

export const isValidBtn = (opLevel: 0 | OpLevel) => {
  // 権限無し or サーバー起動前なら設定可能
  if (
    opLevel === 0 ||
    consoleStore.status(mainStore.selectedWorldID) === 'Stop'
  ) {
    return true;
  }

  // サーバー起動中は`op-permission-level`のLevelのみ設定可能
  if (mainStore.world && isValid(mainStore.world.properties)) {
    return mainStore.world.properties['op-permission-level'] === opLevel;
  }

  // その他は設定不可
  return false;
};
