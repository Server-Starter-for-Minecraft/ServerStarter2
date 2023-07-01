<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import { usePlayerStore } from 'src/stores/WorldTabsStore';
import SsInput from 'src/components/util/base/ssInput.vue';
import PlayerCardView from 'src/components/World/Player/PlayerCardView.vue';
import GroupCardView from 'src/components/World/Player/GroupCardView.vue';
import SelectedPlayersView from 'src/components/World/Player/SelectedPlayersView.vue';
import PlayersOperationView from 'src/components/World/Player/PlayersOperationView.vue';

const mainStore = useMainStore()
const playerStore = usePlayerStore()
</script>

<template>
  <div class="column fit q-px-md">
    <div class="row">
      <SsInput
        v-model="playerStore.searchName"
        dense
        :label="$t('player.search')"
        class="q-py-md col"
        @clear="() => playerStore.searchName = ''"
      />
  
      <q-toggle
        v-model="mainStore.world().properties['white-list']"
        :label="$t('player.join')"
        style="font-size: 1rem;"
      />
    </div>

    <q-scroll-area
      class="full-height"
      style="flex: 1 1 0;"
    >
      <div class="q-py-md fit">
        <span class="text-caption">{{ $t("player.registeredPlayer") }}</span>
        <div class="row q-gutter-sm q-pa-sm">
          <div v-for="player in playerStore.searchPlayers(mainStore.world().players)" :key="player.uuid" class="col-">
            <PlayerCardView
              :uuid="player.uuid"
              :op-level="player.op?.level"
            />
          </div>
        </div>
  
        <q-separator class="q-my-md"/>
  
        <span class="text-caption">{{ $t("player.groupList") }}</span>
        <div class="row q-gutter-sm q-pa-sm">
          <template v-for="group in playerStore.searchGroups()" :key="group">
            <GroupCardView
              :name="group.name"
              :color="group.color"
              :players="group.players"
            />
          </template>
        </div>
      </div>
    </q-scroll-area>
  
    <q-separator />
    
    <SelectedPlayersView />
    <PlayersOperationView :disable="playerStore.focusCards.length === 0"/>
  </div>
</template>