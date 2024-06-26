<script setup lang="ts">
import { isValid } from 'app/src-public/scripts/error';
import { OpLevel, OpSetting } from 'app/src-electron/schema/player';
import { assets } from 'src/assets/assets';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import OpLevelBtn from 'src/components/World/Player/utils/OpLevelBtn.vue';

const mainStore = useMainStore();
const playerStore = usePlayerStore();
const consoleStore = useConsoleStore();

const isValidBtn = (opLevel: 0 | OpLevel) => {
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

function setOP(setVal: 0 | OpLevel) {
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

function removePlayer() {
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
</script>

<template>
  <q-card
    flat
    class="column"
    style="width: 13rem; height: 325px; max-height: 45vh"
  >
    <p class="q-pa-sm q-ma-none text-body2">
      {{ $t('player.editPlayer', { n: playerStore.focusCards.size }) }}
    </p>

    <q-scroll-area style="flex: 1 1 0">
      <template v-for="opLevel in ([4, 3, 2, 1, 0] as const)" :key="opLevel">
        <OpLevelBtn
          :src="assets.svg[`level${opLevel}`]()"
          :label="
            opLevel !== 0 ? $t('player.opLevel') + opLevel : $t('player.noOp')
          "
          :disable="!isValidBtn(opLevel)"
          @click="() => setOP(opLevel)"
        />
      </template>
      <q-separator inset class="q-mt-xs" />
      <OpLevelBtn
        icon="close"
        :label="$t('player.deletePlayer')"
        color="negative"
        @click="removePlayer"
      />
    </q-scroll-area>
  </q-card>
</template>
