<script setup lang="ts">
import { ref } from 'vue';
import GroupCardsView from 'src/components/World/Player/CardView/GroupCardsView.vue';
import PlayerCardsView from 'src/components/World/Player/CardView/PlayerCardsView.vue';
import SideMenuView from 'src/components/World/Player/CardView/SideMenuView.vue';
import CommonView from 'src/components/World/Player/CommonView/CommonView.vue';

const inputResarchName = ref('');
</script>

<template>
  <q-scroll-area class="full-height q-pl-md" style="flex: 1 1 0">
    <CommonView v-model="inputResarchName" />

    <div class="q-py-md fit">
      <PlayerCardsView v-model="inputResarchName" />
      <q-separator class="q-my-md" />
      <GroupCardsView v-model="inputResarchName" />
    </div>
  </q-scroll-area>

  <SideMenuView class="q-pr-md" />
</template>
