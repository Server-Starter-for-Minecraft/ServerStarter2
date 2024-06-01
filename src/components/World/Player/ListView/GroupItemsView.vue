<script setup lang="ts">
import { sortValue, strSort } from 'app/src-public/scripts/obj/objSort';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import GroupItem from './core/GroupItem.vue';

const playerStore = usePlayerStore();
</script>

<template>
  <span class="text-caption">{{ $t('player.groupList') }}</span>
  <q-list separator class="q-px-sm">
    <template
      v-for="(group, gid) in sortValue(
        playerStore.searchGroups(),
        (gObj1, gObj2) => strSort(gObj1.name, gObj2.name)
      )"
      :key="gid"
    >
      <GroupItem :group-id="gid" :group="group" />
    </template>
  </q-list>
</template>
