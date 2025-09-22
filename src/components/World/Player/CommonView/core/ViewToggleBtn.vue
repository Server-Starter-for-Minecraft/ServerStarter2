<script setup lang="ts">
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';

const sysStore = useSystemStore();
const playerStore = usePlayerStore();
const tooltipOffset = [0, 0] as [number, number];

/**
 * View形式が変更された際に発火
 *
 * - Card Viewにおけるグループ編集モードを常にOFFに変更する
 */
function onChangedView() {
  playerStore.openGroupEditor = false;
}
</script>

<template>
  <q-btn-toggle
    v-model="sysStore.systemSettings.user.viewStyle.player"
    @update:model-value="onChangedView"
    outline
    toggle-color="primary"
    :options="[
      { icon: 'grid_view', value: 'card', slot: 'card' },
      { icon: 'list', value: 'list', slot: 'list' },
    ]"
  >
    <template v-slot:card>
      <SsTooltip :name="$t('player.view.card')" :offset="tooltipOffset" />
    </template>
    <template v-slot:list>
      <SsTooltip :name="$t('player.view.list')" :offset="tooltipOffset" />
    </template>
  </q-btn-toggle>
</template>
