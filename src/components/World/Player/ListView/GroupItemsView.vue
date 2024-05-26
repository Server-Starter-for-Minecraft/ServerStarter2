<script setup lang="ts">
import { sort } from 'src/scripts/objSort';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import GroupItem from './core/GroupItem.vue';

const playerStore = usePlayerStore();
</script>

<template>
  <span class="text-caption">{{ $t('player.groupList') }}</span>
  <q-list>
    <div v-for="group in sort(playerStore.searchGroups())" :key="group.name">
      <GroupItem :group="group" />
    </div>
  </q-list>
</template>
