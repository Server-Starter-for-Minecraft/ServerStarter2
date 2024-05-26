<script setup lang="ts">
import { PlayerGroup } from 'app/src-electron/schema/player';
import { deepcopy } from 'src/scripts/deepcopy';
import { sort } from 'src/scripts/objSort';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import AddContentsCard from 'src/components/util/AddContentsCard.vue';
import GroupCard from './core/GroupCard.vue';

const playerStore = usePlayerStore();

function openGroupEditor(group?: PlayerGroup) {
  // 情報を登録
  if (group === void 0) {
    playerStore.selectedGroup = {
      name: '',
      color: '#ffffff',
      players: Array.from(playerStore.focusCards),
      isNew: true,
    };
    playerStore.selectedGroupName = '';
  } else {
    playerStore.focusCards = new Set(group.players);
    playerStore.selectedGroup = deepcopy(
      Object.assign(group, { isNew: false })
    );
    playerStore.selectedGroupName = group.name;
  }

  // Editorを開く
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
          @click="() => openGroupEditor()"
        />
      </div>
      <div v-for="group in sort(playerStore.searchGroups())" :key="group.name">
        <GroupCard
          :name="group.name"
          :color="group.color"
          :players="group.players"
          @edit="() => openGroupEditor(group)"
        />
      </div>
    </div>
  </div>
</template>
