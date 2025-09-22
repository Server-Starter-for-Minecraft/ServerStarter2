<script setup lang="ts">
import { recordValueFilter } from 'app/src-public/scripts/obj/objFillter';
import { sortValue, strSort } from 'app/src-public/scripts/obj/objSort';
import { UUID } from 'app/src-electron/schema/brands';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import AddContentsCard from 'src/components/util/AddContentsCard.vue';
import GroupCard from './core/GroupCard.vue';

const inputResarchName = defineModel<string>({ required: true });

const sysStore = useSystemStore();
const playerStore = usePlayerStore();

function addGroup() {
  const gid = playerStore.addGroup();
  openGroupEditor(gid);
}

function openGroupEditor(groupID: UUID) {
  // Editorを開く
  playerStore.selectedGroupId = groupID;
  playerStore.openGroupEditor = true;
}

/**
 * 読み込み済みグループ一覧から、検索ワードにマッチするグループのみを返す
 */
function filteredGroups() {
  const groups = sysStore.systemSettings.player.groups;
  if (inputResarchName.value === '') {
    return groups;
  } else {
    return recordValueFilter(groups, (g) =>
      g.name.toLowerCase().includes(inputResarchName.value.toLowerCase())
    );
  }
}
</script>

<template>
  <span class="text-caption">{{ $t('player.groupList') }}</span>
  <div class="row q-pa-sm">
    <div class="row q-gutter-sm col-">
      <div>
        <AddContentsCard
          :label="$t('player.makeGroup')"
          min-height="100px"
          @click="addGroup()"
        />
      </div>
      <div
        v-for="(group, gid) in sortValue(filteredGroups(), (gObj1, gObj2) =>
          strSort(gObj1.name, gObj2.name)
        )"
        :key="gid"
      >
        <GroupCard
          :name="group.name"
          :color="group.color"
          :players="group.players"
          @edit="() => openGroupEditor(gid)"
        />
      </div>
    </div>
  </div>
</template>
