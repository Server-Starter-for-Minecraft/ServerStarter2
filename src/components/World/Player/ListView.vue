<script setup lang="ts">
import { ref } from 'vue';
import { PlayerSetting } from 'app/src-electron/schema/player';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import CommonView from 'src/components/World/Player/CommonView/CommonView.vue';
import GroupItemsView from './ListView/GroupItemsView.vue';
import PlayerItemsView from './ListView/PlayerItemsView.vue';

const validPlayers = defineModel<PlayerSetting[]>({ required: true });

const sysStore = useSystemStore();
const playerStore = usePlayerStore();

const splitPos = ref(50);
</script>

<template>
  <div class="column fit q-px-md">
    <CommonView>
      <template #btnLine>
        <q-btn
          outline
          label="プレイヤーをグループ化"
          color="primary"
          :disable="playerStore.focusCards.size === 0"
          @click="playerStore.addGroup()"
        />
      </template>
      <template #toggleLine>
        <SsBtn
          v-show="sysStore.systemSettings.user.viewStyle.player === 'list'"
          free-width
          :disable="playerStore.focusCards.size === 0"
          label="全ての選択を解除"
          @click="() => playerStore.unFocus()"
        />
      </template>
    </CommonView>

    <q-splitter
      v-model="splitPos"
      :limits="[5, 95]"
      horizontal
      emit-immediately
      separator-style="height: 3px; margin-bottom: 12px"
      class="q-py-md fit col"
    >
      <template #before>
        <PlayerItemsView v-model="validPlayers" />
      </template>
      <template #after>
        <GroupItemsView />
      </template>
    </q-splitter>
  </div>
</template>
