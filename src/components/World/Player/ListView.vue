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

const DEFAULT_POS = 25
const splitPos = ref(DEFAULT_POS);
</script>

<template>
  <div class="column fit q-px-md">
    <CommonView>
      <template #btnLine>
        <q-btn
          outline
          :label="$t('player.grouping')"
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
          :label="$t('player.deselectAll')"
          @click="() => playerStore.unFocus()"
        />
      </template>
    </CommonView>

    <q-splitter
      v-model="splitPos"
      @dblclick="splitPos = DEFAULT_POS"
      :limits="[15, 80]"
      emit-immediately
      separator-style="margin-left: 10px; margin-right: 10px"
      class="q-py-md fit col"
    >
      <template #before>
        <GroupItemsView />
      </template>
      <template #after>
        <PlayerItemsView v-model="validPlayers" />
      </template>
    </q-splitter>
  </div>
</template>
