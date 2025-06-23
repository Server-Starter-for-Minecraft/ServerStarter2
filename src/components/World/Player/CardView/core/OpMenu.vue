<script setup lang="ts">
import { assets } from 'src/assets/assets';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import OpLevelBtn from 'src/components/World/Player/utils/OpLevelBtn.vue';
import { isValidBtn, removePlayer, setOp } from '../../utils/playerOp';

const playerStore = usePlayerStore();
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
          @click="() => setOp(opLevel)"
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
