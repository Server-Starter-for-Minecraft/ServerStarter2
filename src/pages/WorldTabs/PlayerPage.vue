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
        :label="$t('player.search')"
        class="q-py-md col"
        @clear="() => playerStore.searchName = ''"
      />
  
      <q-toggle
        v-model="toggle1"
        :label="$t('player.join')"
        style="font-size: 1rem;"
      />
    </div>
  
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
  </div>
</template>