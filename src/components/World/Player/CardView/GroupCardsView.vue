<script setup lang="ts">
import { sortValue, strSort } from 'app/src-public/scripts/obj/objSort';
import { UUID } from 'app/src-electron/schema/brands';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import AddContentsCard from 'src/components/util/AddContentsCard.vue';
import GroupCard from './core/GroupCard.vue';

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
        v-for="(group, gid) in sortValue(
          playerStore.searchGroups(),
          (gObj1, gObj2) => strSort(gObj1.name, gObj2.name)
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
