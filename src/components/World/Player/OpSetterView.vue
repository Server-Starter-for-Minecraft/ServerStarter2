<script setup lang="ts">
import { assets } from 'src/assets/assets';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import OpLevelBtn from 'src/components/World/Player/utils/OpLevelBtn.vue';
import { useMainStore } from 'src/stores/MainStore';
import { OpLevel, OpSetting } from 'app/src-electron/schema/player';
import { isValid } from 'src/scripts/error';

const mainStore = useMainStore()
const playerStore = usePlayerStore()


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
    style="width: 13rem; height: 350px; max-height: 35vh;"
  >
    <p class="q-pa-sm q-ma-none text-body2">{{ `${playerStore.focusCards.size} 人の設定を編集` }}</p>
    
    <q-scroll-area style="flex: 1 1 0;">
      <OpLevelBtn
        icon="close"
        label="プレイヤーを削除"
        color="red"
        @click="removePlayer"
      />
      <q-separator inset />
      <template v-for="opLevel in ([4, 3, 2, 1, 0] as const)" :key="opLevel">
        <OpLevelBtn
          :src="assets.svg[`level${opLevel}`]"
          :label="opLevel !== 0 ? `権限レベル${opLevel}` : '権限なし'"
          @click="() => setOP(opLevel)"
        />
      </template>
    </q-scroll-area>
  </q-card>
</template>