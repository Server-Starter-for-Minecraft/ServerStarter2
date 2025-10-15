<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { recordValueFilter } from 'app/src-public/scripts/obj/objFillter';
import { sortValue, strSort } from 'app/src-public/scripts/obj/objSort';
import { useSystemStore } from 'src/stores/SystemStore';
import GroupItem from './core/GroupItem.vue';

const inputResearchName = defineModel<string>({ required: true });

const sysStore = useSystemStore();
const autoFocus = ref(false);

/**
 * 読み込み済みグループ一覧から、検索ワードにマッチするグループのみを返す
 */
function filteredGroups() {
  const groups = sysStore.systemSettings.player.groups;
  if (inputResearchName.value === '') {
    return groups;
  } else {
    return recordValueFilter(groups, (g) =>
      g.name.toLowerCase().includes(inputResearchName.value.toLowerCase())
    );
  }
}

// プレイヤータグ表示直後はグループ名にAutoFocusさせない
onMounted(() => (autoFocus.value = true));
</script>

<template>
  <span class="text-caption">{{ $t('player.groupList') }}</span>
  <q-list>
    <GroupItem
      v-for="(group, gid) in sortValue(filteredGroups(), (gObj1, gObj2) =>
        strSort(gObj1.name, gObj2.name)
      )"
      :key="gid"
      v-model="autoFocus"
      :group-id="gid"
      :group="group"
    />
  </q-list>
</template>
