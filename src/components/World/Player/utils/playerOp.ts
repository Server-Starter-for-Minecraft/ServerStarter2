import { isValid } from 'app/src-public/scripts/error';
import { OpLevel, OpSetting } from 'app/src-electron/schema/player';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';

const mainStore = useMainStore();
const playerStore = usePlayerStore();
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

export function setOp(setVal: 0 | OpLevel) {
  function setter(setVal?: OpSetting) {
    if (mainStore.world && isValid(mainStore.world.players)) {
      mainStore.world.players
        .filter((p) => playerStore.focusCards.has(p.uuid))
        .forEach((p) => {
          p.op = setVal;
        });
    }
  }

  if (setVal === 0) {
    setter();
  } else {
    setter({ level: setVal, bypassesPlayerLimit: false });
  }

  // フォーカスのリセット
  playerStore.unFocus();
}

export function removePlayer() {
  // フォーカスされているプレイヤーを削除
  playerStore.focusCards.forEach((selectedPlayerUUID) => {
    if (mainStore.world && isValid(mainStore.world.players)) {
      mainStore.world.players.splice(
        mainStore.world.players.map((p) => p.uuid).indexOf(selectedPlayerUUID),
        1
      );
    }
  });
  // フォーカスのリセット
  playerStore.unFocus();
}
