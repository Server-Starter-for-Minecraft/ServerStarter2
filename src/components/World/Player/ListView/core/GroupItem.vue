<script setup lang="ts">
import { computed, ref } from 'vue';
import { PlayerUUID, UUID } from 'app/src-electron/schema/brands';
import { PlayerGroup } from 'app/src-electron/schema/player';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import PlayerIcon from '../../utils/PlayerIcon.vue';
import GroupColorPicker from './parts/GroupColorPicker.vue';

const autoFocus = defineModel<boolean>({ required: true });

interface Prop {
  groupId: UUID;
  group: PlayerGroup;
}
const prop = defineProps<Prop>();

const sysStore = useSystemStore();
const playerStore = usePlayerStore();
const hovered = ref(false);
const groupName = computed({
  get: () => sysStore.systemSettings.player.groups[prop.groupId].name,
  set: (newVal) => {
    sysStore.systemSettings.player.groups[prop.groupId].name = newVal;
  },
});


function addMember(uuid: PlayerUUID) {
  playerStore.updateGroup(prop.groupId, (g) => {
    if (g.players.indexOf(uuid) === -1) {
      g.players.push(uuid);
    }
    return g;
  });
  playerStore.unFocus();
}

function selectGroupMembers() {
  playerStore.selectGroup(prop.group.name);
}

function changeColor(colorCode: string) {
  playerStore.updateGroup(prop.groupId, (g) => {
    g.color = colorCode;
    return g;
  });
}

function removeMember(uuid: PlayerUUID) {
  playerStore.updateGroup(prop.groupId, (g) => {
    g.players.splice(g.players.indexOf(uuid), 1);
    return g;
  });
}
</script>

<template>
  <q-item
    clickable
    class="column"
    @mouseover="hovered = true"
    @mouseleave="hovered = false"
    @click="selectGroupMembers"
  >
    <div class="row full-width">
      <div class="row q-gutter-md items-center col">
        <!-- 背景要素である`q-item`にクリックイベントが伝播しないように@click.stopでラップ -->
        <div @click.stop class="q-ml-none">
          <GroupColorPicker :group-color="group.color" :change-color="changeColor" />
        </div>

        <div @click.stop>
          <q-input
            v-model="groupName"
            :autofocus="autoFocus"
            flat
            dense
            style="font-size: 1.2rem"
          />
        </div>
      </div>

      <div v-if="hovered" class="row q-gutter-md">
        <SsBtn
          free-width
          :disable="playerStore.focusCards.size === 0"
          label="選択中のプレイヤーをグループに追加"
          color="primary"
          @click.stop="playerStore.focusCards.forEach(addMember)"
        />
        <SsBtn
          free-width
          label="グループを削除"
          color="negative"
          @click.stop="playerStore.removeGroup(groupId)"
        />
      </div>
    </div>

    <div class="q-pl-md q-py-sm row q-gutter-sm">
      <div v-for="pId in group.players" :key="pId">
        <PlayerIcon
          hover-btn
          :uuid="pId"
          :negative-btn-clicked="removeMember"
        />
      </div>
    </div>
  </q-item>
</template>

<style scoped lang="scss">
.avaterImg {
  position: absolute;
  image-rendering: pixelated;
}
</style>
