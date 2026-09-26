<script setup lang="ts">
import { ref } from 'vue';
import GroupCardsView from 'src/components/World/Player/CardView/GroupCardsView.vue';
import PlayerCardsView from 'src/components/World/Player/CardView/PlayerCardsView.vue';
import SideMenuView from 'src/components/World/Player/CardView/SideMenuView.vue';
import CommonView from 'src/components/World/Player/CommonView/CommonView.vue';

const inputResearchName = ref('');
</script>

<template>
  <q-scroll-area class="full-height q-pl-md" style="flex: 1 1 0">
    <CommonView v-model="inputResearchName" />

    <div class="q-py-md fit">
      <PlayerCardsView v-model="inputResearchName" />
      <q-separator class="q-my-md" />
      <GroupCardsView v-model="inputResearchName" />
    </div>
  </q-scroll-area>

  <SideMenuView class="q-pr-md" />
</template>
