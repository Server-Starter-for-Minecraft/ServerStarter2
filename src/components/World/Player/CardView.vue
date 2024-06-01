<script setup lang="ts">
import { PlayerSetting } from 'app/src-electron/schema/player';
import GroupCardsView from 'src/components/World/Player/CardView/GroupCardsView.vue';
import PlayerCardsView from 'src/components/World/Player/CardView/PlayerCardsView.vue';
import SideMenuView from 'src/components/World/Player/CardView/SideMenuView.vue';
import CommonView from 'src/components/World/Player/CommonView/CommonView.vue';

const validPlayers = defineModel<PlayerSetting[]>({ required: true });
</script>

<template>
  <q-scroll-area class="full-height q-pl-md" style="flex: 1 1 0">
    <CommonView />

    <div class="q-py-md fit">
      <PlayerCardsView v-model="validPlayers" />
      <q-separator class="q-my-md" />
      <GroupCardsView />
    </div>
  </q-scroll-area>

  <SideMenuView class="q-pr-md" />
</template>
