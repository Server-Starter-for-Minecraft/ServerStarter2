<script setup lang="ts">
import { OpLevel, OpSetting } from 'app/src-electron/schema/player';
import { ServerProperties } from 'app/src-electron/schema/serverproperty';
import { isValid } from 'src/scripts/error';
import { assets } from 'src/assets/assets';
import { useMainStore } from 'src/stores/MainStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import OpLevelBtn from 'src/components/World/Player/utils/OpLevelBtn.vue';

interface Prop {
  validProperties: ServerProperties
}
defineProps<Prop>()

const mainStore = useMainStore()
const playerStore = usePlayerStore()
const consoleStore = useConsoleStore()


function setOP(setVal: 0 | OpLevel) {
  function setter(setVal?: OpSetting) {
    if (isValid(mainStore.world.players)) {
      mainStore.world.players.filter(
        p => playerStore.focusCards.has(p.uuid)
      ).forEach(p => {
        p.op = setVal
      });
    }
  }

  if (setVal === 0) {
    setter()
  }
  else {
    setter({ level: setVal, bypassesPlayerLimit: false })
  }
  
  // フォーカスのリセット
  playerStore.unFocus()
}

function removePlayer() {
  // フォーカスされているプレイヤーを削除
  playerStore.focusCards.forEach(selectedPlayerUUID => {
    if (isValid(mainStore.world.players)) {
      mainStore.world.players.splice(
        mainStore.world.players.map(p => p.uuid).indexOf(selectedPlayerUUID), 1
      )
    }
  });
  // フォーカスのリセット
  playerStore.unFocus()
}
</script>

<template>
  <q-card
    flat
    class="column"
    style="width: 13rem; height: 325px; max-height: 45vh;"
  >
    <p class="q-pa-sm q-ma-none text-body2">{{ $t('player.editPlayer',{n: playerStore.focusCards.size}) }}</p>
    
    <q-scroll-area style="flex: 1 1 0;">
      <template v-for="opLevel in ([4, 3, 2, 1, 0] as const)" :key="opLevel">
        <OpLevelBtn
          :src="assets.svg[`level${opLevel}`]()"
          :label="opLevel !== 0 ? $t('player.opLevel') + opLevel : $t('player.noOp')"
          :disable="consoleStore.status(mainStore.world.id) !== 'Stop' && ![validProperties['op-permission-level'], 0].includes(opLevel)"
          @click="() => setOP(opLevel)"
        />
      </template>
      <q-separator inset class="q-mt-xs" />
      <OpLevelBtn
        icon="close"
        :label="$t('player.deletePlayer')"
        color="red"
        @click="removePlayer"
      />
    </q-scroll-area>
  </q-card>
</template>