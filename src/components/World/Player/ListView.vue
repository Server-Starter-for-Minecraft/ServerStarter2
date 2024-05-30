<script setup lang="ts">
import { PlayerSetting } from 'app/src-electron/schema/player';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import CommonView from 'src/components/World/Player/CommonView/CommonView.vue';
import GroupItemsView from './ListView/GroupItemsView.vue';
import PlayerItemsView from './ListView/PlayerItemsView.vue';
import { values } from 'app/src-public/scripts/obj/obj';

const validPlayers = defineModel<PlayerSetting[]>({ required: true });

const sysStore = useSystemStore();
const playerStore = usePlayerStore();

function generateGroup() {
  // TODO: 命名処理をバックエンドから共通化
  const __groupName = 'test_2';
  // TODO: マイクラ16色の更新時にここの処理が問題ないか確認
  const colorCodes = values(sysStore.staticResouces.minecraftColors);
  const __colorCode =
    colorCodes[Math.round(Math.random() * (colorCodes.length - 1))];

  sysStore.systemSettings.player.groups[__groupName] = {
    name: __groupName,
    color: __colorCode,
    players: [...playerStore.focusCards],
  };
}
</script>

<template>
  <q-scroll-area class="full-height" style="flex: 1 1 0">
    <CommonView>
      <template #btnLine>
        <q-btn
          outline
          label="プレイヤーをグループ化"
          color="primary"
          :disable="playerStore.focusCards.size === 0"
          @click="generateGroup"
        />
      </template>
    </CommonView>

    <div class="q-py-md fit">
      <PlayerItemsView v-model="validPlayers" />
      <q-separator class="q-my-md" />
      <GroupItemsView />
    </div>
  </q-scroll-area>
</template>
