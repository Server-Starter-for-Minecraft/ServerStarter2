<script setup lang="ts">
import { ref } from 'vue';
import { useMainStore } from 'src/stores/MainStore';
import { usePlayerStore } from 'src/stores/WorldTabsStore';
import SsInput from 'src/components/util/base/ssInput.vue';
import PlayerCardView from 'src/components/World/Player/PlayerCardView.vue';
import GroupCardView from 'src/components/World/Player/GroupCardView.vue';

const mainStore = useMainStore()
const playerStore = usePlayerStore()

const toggle1 = ref(true)
</script>

<template>
  <div class="q-px-md">
    <div class="row">
      <SsInput
        v-model="playerStore.searchName"
        label="プレイヤーを検索"
        class="q-py-md col"
        @clear="() => playerStore.searchName = ''"
      />
  
      <q-toggle
        v-model="toggle1"
        label="登録済みのプレイヤーのみ参加可能"
        style="font-size: 1rem;"
      />
    </div>
  
    <div class="q-py-md fit">
      <span class="text-caption">追加済みプレイヤー</span>
      <div class="row items-start">
        <template v-for="player in playerStore.searchPlayers(mainStore.world().players)" :key="player">
          <PlayerCardView
            :uuid="player.uuid"
            :op-level="player.op?.level"
          />
        </template>
      </div>

      <q-separator class="q-my-md"/>

      <span class="text-caption">グループ一覧</span>
      <div class="row items-start">
        <template v-for="group in playerStore.searchGroups()" :key="group">
          <GroupCardView
            :name="group.name"
            :players="group.players"
          />
        </template>
      </div>
    </div>
  </div>
</template>