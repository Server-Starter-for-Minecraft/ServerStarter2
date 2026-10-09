<script setup lang="ts">
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import ViewStyleToggle from 'src/components/util/ViewStyleToggle.vue';

const playerStore = usePlayerStore();

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
  <ViewStyleToggle target="player" @change="onChangedView" />
</template>
