<script setup lang="ts">
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import GroupEditMenu from './core/GroupEditMenu.vue';
import OpMenu from './core/OpMenu.vue';
import SelectedPlayersMenu from './core/SelectedPlayersMenu.vue';

const playerStore = usePlayerStore();
</script>

<template>
  <div class="column q-gutter-y-md q-py-md">
    <!-- グループ設定は動的に読み込む -->
    <GroupEditMenu
      v-if="playerStore.openGroupEditor"
      :is="playerStore.openGroupEditor"
    />
    <OpMenu v-else />
    <SelectedPlayersMenu />
  </div>
</template>
