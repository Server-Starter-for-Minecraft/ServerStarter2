<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore'
import { isValid } from 'src/scripts/error';
import SsInput from 'src/components/util/base/ssInput.vue';
import PlayerCardView from 'src/components/World/Player/PlayerCardView.vue';
import GroupCardView from 'src/components/World/Player/GroupCardView.vue';
import SelectedPlayersView from 'src/components/World/Player/SelectedPlayersView.vue';
import PlayersOperationView from 'src/components/World/Player/PlayersOperationView.vue';
import SearchResultView from 'src/components/World/Player/SearchResultView.vue';
import PlayerJoinToggleView from 'src/components/World/Player/PlayerJoinToggleView.vue';

const mainStore = useMainStore()
const playerStore = usePlayerStore()
</script>

<template>
  <div v-if="isValid(mainStore.world.players)" class="column fit q-px-md">
    <div class="row">
      <SsInput
        v-model="playerStore.searchName"
        dense
        :label="$t('player.search')"
        :debounce="200"
        class="q-py-md col"
        @clear="() => playerStore.searchName = ''"
      />

      <PlayerJoinToggleView
        v-if="isValid(mainStore.world.properties)"
        v-model="mainStore.world.properties"
      />
    </div>

    
    <q-scroll-area
      class="full-height"
      style="flex: 1 1 0;"
    >
      <div class="q-py-md fit">
        <div v-show="playerStore.searchName !== ''" class="q-pb-md">
          <span class="text-caption">新規プレイヤー</span>
          <SearchResultView />
        </div>

        <span class="text-caption">{{ $t("player.registeredPlayer") }}</span>
        <div class="row q-gutter-sm q-pa-sm">
          <div v-for="player in playerStore.searchPlayers(mainStore.world.players)" :key="player.uuid" class="col-">
            <PlayerCardView
              :uuid="player.uuid"
              :op-level="player.op?.level"
            />
          </div>
        </div>

        <q-separator class="q-my-md" />

        <span class="text-caption">{{ $t("player.groupList") }}</span>
        <div class="row q-gutter-sm q-pa-sm">
          <div v-for="group in playerStore.searchGroups()" :key="group.name" class="col-">
            <GroupCardView
              :name="group.name"
              :color="group.color"
              :players="group.players"
            />
          </div>
        </div>
      </div>
    </q-scroll-area>

    <q-separator />

    <SelectedPlayersView />
    <PlayersOperationView v-model="mainStore.world.players" :disable="playerStore.focusCards.size === 0" />
  </div>

  <!-- TODO: 画面の調整 -->
  <div v-else>
    プレイヤー設定の読み込みに失敗しました
  </div>
</template>