<script setup lang="ts">
import { ref } from 'vue';
import { useMainStore } from 'src/stores/MainStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore'
import { isValid } from 'src/scripts/error';
import SsInput from 'src/components/util/base/ssInput.vue';
import PlayerCardView from 'src/components/World/Player/PlayerCardView.vue';
import GroupCardView from 'src/components/World/Player/GroupCardView.vue';
import SearchResultView from 'src/components/World/Player/SearchResultView.vue';
import PlayerJoinToggleView from 'src/components/World/Player/PlayerJoinToggleView.vue';
import OpSetterView from 'src/components/World/Player/OpSetterView.vue';
import SelectedPlayersView from 'src/components/World/Player/SelectedPlayersView.vue';
import { generateGroup, iEditorDialogProps, iEditorDialogReturns } from 'src/components/World/Player/Editor/editorDialog';
import AddContentsCard from 'src/components/util/AddContentsCard.vue';


const mainStore = useMainStore()
const playerStore = usePlayerStore()

const openGroupEditor = ref(false)
</script>

<template>
  <div v-if="isValid(mainStore.world.players)" class="column fit q-px-md">
    <div class="row full-height">
      <q-scroll-area
        class="full-height"
        style="flex: 1 1 0;"
      >
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
          <div class="row q-pa-sm">
            <div class="row q-gutter-sm col-">
              <div>
                <AddContentsCard
                  label="グループを作成"
                  min-height="100px"
                  @click="generateGroup('kusakusa', '#ffffff', Array.from(playerStore.focusCards))"
                />
              </div>
              <div v-for="group in playerStore.searchGroups()" :key="group.name">
                <GroupCardView
                  :name="group.name"
                  :color="group.color"
                  :players="group.players"
                />
              </div>
            </div>
          </div>
        </div>
      </q-scroll-area>

      <div class="column q-ml-md">
        <OpSetterView class="q-my-md"/>
        
        <SelectedPlayersView />
      </div>
    </div>
  </div>

  <div v-else class="justify-center row fit">
    <p style="margin: auto 0;">プレイヤー設定の読み込みに失敗しました</p>
  </div>
</template>