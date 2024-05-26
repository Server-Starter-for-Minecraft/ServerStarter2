<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import Mousetrap from 'mousetrap';
import { isValid } from 'src/scripts/error';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import CardView from 'src/components/World/Player/CardView.vue';
import ListView from 'src/components/World/Player/ListView.vue';

const sysStore = useSystemStore();
const mainStore = useMainStore();
const playerStore = usePlayerStore();

onMounted(() => {
  Mousetrap.bind('backspace', () => playerStore.removePlayer());
  Mousetrap.bind('ctrl+a', () => playerStore.addFocus());
  Mousetrap.bind('del', () => playerStore.removePlayer());
  Mousetrap.bind('esc', () => playerStore.unFocus());
});

onUnmounted(() => {
  Mousetrap.unbind('backspace');
  Mousetrap.unbind('ctrl+a');
  Mousetrap.unbind('del');
  Mousetrap.unbind('esc');
});
</script>

<template>
  <div v-if="isValid(mainStore.world.players)" class="column fit q-px-md">
    <div class="row full-height q-gutter-x-md" @click="playerStore.unFocus()">
      <CardView
        v-if="sysStore.systemSettings.user.viewStyle.player === 'card'"
        v-model="mainStore.world.players"
      />
      <ListView
        v-if="sysStore.systemSettings.user.viewStyle.player === 'list'"
        v-model="mainStore.world.players"
      />
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
