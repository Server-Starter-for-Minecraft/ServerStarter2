<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import Mousetrap from 'mousetrap';
import { isValid } from 'src/scripts/error';
import { useMainStore } from 'src/stores/MainStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import CardView from 'src/components/World/Player/CardView.vue';
import ListView from 'src/components/World/Player/ListView.vue';

const mainStore = useMainStore();
const playerStore = usePlayerStore();

// TODO: 'List View' or 'Card View' のSystemSettingsが追加されたら差し替え
const tmp = ref('list');

onMounted(() => {
  Mousetrap.bind('backspace', () => playerStore.removePlayer());
  Mousetrap.bind('del', () => playerStore.removePlayer());
  Mousetrap.bind('esc', () => playerStore.unFocus());
});

onUnmounted(() => {
  Mousetrap.unbind('backspace');
  Mousetrap.unbind('del');
  Mousetrap.unbind('esc');
});
</script>

<template>
  <div v-if="isValid(mainStore.world.players)" class="column fit q-px-md">
    <div
      class="row full-height q-gutter-x-md"
      @click="playerStore.unFocus()"
    >
      <CardView v-if="tmp === 'card'" v-model="mainStore.world.players" />
      <ListView v-if="tmp === 'list'" v-model="mainStore.world.players" />
    </div>
  </div>

  <div v-else class="fit" style="position: relative">
    <div class="absolute-center">
      <p>{{ $t('player.failed') }}</p>
      <SsBtn
        :label="$t('player.resetPlayerSettings')"
        color="primary"
        @click="mainStore.world.players = []"
        class="full-width"
      />
    </div>
  </div>
</template>
