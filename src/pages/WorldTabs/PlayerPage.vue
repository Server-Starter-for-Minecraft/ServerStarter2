<script setup lang="ts">
import { Ref, ref } from 'vue';
import { PlayerGroup, PlayerSetting } from 'app/src-electron/schema/player';
import { isValid } from 'src/scripts/error';
import { deepCopy } from 'src/scripts/deepCopy';
import { sort, strSort } from 'src/scripts/objSort';
import { useMainStore } from 'src/stores/MainStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore'
import SsBtn from 'src/components/util/base/ssBtn.vue';
import SsInput from 'src/components/util/base/ssInput.vue';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import PlayerCardView from 'src/components/World/Player/PlayerCardView.vue';
import GroupCardView from 'src/components/World/Player/GroupCardView.vue';
import SearchResultView from 'src/components/World/Player/SearchResultView.vue';
import PlayerJoinToggleView from 'src/components/World/Player/PlayerJoinToggleView.vue';
import OpSetterView from 'src/components/World/Player/OpSetterView.vue';
import SelectedPlayersView from 'src/components/World/Player/SelectedPlayersView.vue';
import AddContentsCard from 'src/components/util/AddContentsCard.vue';
import GroupEditorView from 'src/components/World/Player/GroupEditorView.vue';

const mainStore = useMainStore()
const playerStore = usePlayerStore()

// ページを読み込んだ時に検索欄をリセット
playerStore.searchName = ''

const orderTypes = ['name', 'op'] as const
const playerOrder: Ref<(typeof orderTypes)[number]> = ref('name')
function playerSortFunc(orderType: (typeof orderTypes)[number]): (a: PlayerSetting, b: PlayerSetting) => number {
  switch (orderType) {
    case 'name':
      return (a: PlayerSetting, b: PlayerSetting) => strSort(a.name, b.name)
    case 'op':
      return (a: PlayerSetting, b: PlayerSetting) => {
        return (b.op?.level ?? 0) - (a.op?.level ?? 0)
      }
  }
}

function openGroupEditor(group?: PlayerGroup) {
  // 情報を登録
  if (group === void 0) {
    playerStore.selectedGroup = {
      name: '',
      color: '#ffffff',
      players: Array.from(playerStore.focusCards),
      isNew: true
    }
    playerStore.selectedGroupName = ''
  }
  else {
    playerStore.focusCards = new Set(group.players)
    playerStore.selectedGroup = deepCopy(Object.assign(group, { isNew: false }))
    playerStore.selectedGroupName = group.name
  }
  
  // Editorを開く
  playerStore.openGroupEditor = true
}
</script>

<template>
  <div v-if="isValid(mainStore.world.players)" class="column fit q-px-md">
    <div class="row full-height">
      <q-scroll-area
        class="full-height"
        style="flex: 1 1 0;"
      >
        <p class="q-pt-md text-body2" style="opacity: .6;">
          {{ $t('player.description') }}
        </p>

        <SsInput
          v-model="playerStore.searchName"
          dense
          :placeholder="$t('player.search')"
          :debounce="200"
          class="q-pb-md col"
        />

        <PlayerJoinToggleView
          v-if="isValid(mainStore.world.properties)"
          v-model="mainStore.world.properties"
        />
        
        <div class="q-py-md fit">
          <div v-show="playerStore.searchName !== ''" class="q-pb-md">
            <span class="text-caption">{{ $t('player.newPlayer') }}</span>
            <!-- TODO: 検索結果UIを更新 -->
            <SearchResultView />
          </div>

          <div class="row full-width items-center">
            <span class="text-caption">{{ $t("player.registeredPlayer") }}</span>
            <q-space />
            <SsSelect
              dense
              v-model="playerOrder"
              :options="orderTypes"
              :label="$t('player.sort')"
              style="width: 6.5rem; margin-right: 10px;"
            />
          </div>
          <div v-if="mainStore.world.players.length !== 0" class="row q-gutter-sm q-pa-sm">
            <div
              v-for="
                player in deepCopy(
                  playerStore.searchPlayers(mainStore.world.players)
                ).sort(
                  playerSortFunc(playerOrder)
                )"
              :key="player.uuid"
              class="col-"
            >
              <PlayerCardView
                :uuid="player.uuid"
                :op-level="player.op?.level"
              />
            </div>
          </div>
          <div v-else class="full-width text-center text-h5 q-py-xl" style="opacity: .6;">
            {{ $t('player.notRegistered') }}
          </div>

          <q-separator class="q-my-md" />

          <span class="text-caption">{{ $t("player.groupList") }}</span>
          <div class="row q-pa-sm">
            <div class="row q-gutter-sm col-">
              <div>
                <AddContentsCard
                  :label="$t('player.makeGroup')"
                  min-height="100px"
                  @click="() => openGroupEditor()"
                />
              </div>
              <div v-for="group in sort(playerStore.searchGroups())" :key="group.name">
                <GroupCardView
                  :name="group.name"
                  :color="group.color"
                  :players="group.players"
                  @edit="() => openGroupEditor(group)"
                />
              </div>
            </div>
          </div>
        </div>
      </q-scroll-area>

      <div class="column q-ml-md">
        <!-- グループ設定は動的に読み込む -->
        <GroupEditorView
          v-if="playerStore.openGroupEditor"
          :is="playerStore.openGroupEditor"
          class="q-my-md"
        />
        <OpSetterView
          v-if="!playerStore.openGroupEditor && isValid(mainStore.world.properties)"
          :valid-properties="mainStore.world.properties"
          class="q-my-md"
        />
        <SelectedPlayersView />
      </div>
    </div>
  </div>

  <div v-else class="fit" style="position: relative;">
    <div class="absolute-center">
      <p>{{ $t('player.failed') }}</p>
      <SsBtn
        :label="$t('player.resetPlayerSettings')"
        color="primary"
        @click="mainStore.world.players = []"
        class="full-width"
      />
    </div>
  </div>
</template>