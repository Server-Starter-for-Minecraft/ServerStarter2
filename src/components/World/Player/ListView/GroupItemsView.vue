<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { sortValue, strSort } from 'app/src-public/scripts/obj/objSort';
import { useSystemStore } from 'src/stores/SystemStore';
import GroupItem from './core/GroupItem.vue';

const sysStore = useSystemStore();
const autoFocus = ref(false);

// プレイヤータグ表示直後はグループ名にAutoFocusさせない
onMounted(() => (autoFocus.value = true));
</script>

<template>
  <span class="text-caption">{{ $t('player.groupList') }}</span>
  <q-list>
    <GroupItem
      v-for="(group, gid) in sortValue(
        sysStore.systemSettings.player.groups,
        (gObj1, gObj2) => strSort(gObj1.name, gObj2.name)
      )"
      :key="gid"
      v-model="autoFocus"
      :group-id="gid"
      :group="group"
    />
  </q-list>
</template>
