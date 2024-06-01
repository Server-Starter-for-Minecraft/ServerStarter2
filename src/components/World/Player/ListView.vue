<script setup lang="ts">
import { PlayerSetting } from 'app/src-electron/schema/player';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import CommonView from 'src/components/World/Player/CommonView/CommonView.vue';
import GroupItemsView from './ListView/GroupItemsView.vue';
import PlayerItemsView from './ListView/PlayerItemsView.vue';

const validPlayers = defineModel<PlayerSetting[]>({ required: true });

const playerStore = usePlayerStore();
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
          @click="playerStore.addGroup()"
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
