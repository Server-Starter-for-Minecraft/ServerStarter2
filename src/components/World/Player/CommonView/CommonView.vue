<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { isValid } from 'app/src-public/scripts/error';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { ViewStyleSetting } from 'app/src-electron/schema/system';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsInput from 'src/components/util/base/ssInput.vue';
import SsSelectScope from 'src/components/util/base/ssSelectScope.vue';
import SearchResultCard from 'src/components/util/SearchResultCard.vue';
import PlayerJoinToggle from './core/PlayerJoinToggle.vue';

const sysStore = useSystemStore();
const mainStore = useMainStore();
const playerStore = usePlayerStore();
const { t } = useI18n();

// ページを読み込んだ時に検索欄をリセット
playerStore.searchName = '';

function createViewMap(viewType: ViewStyleSetting['player']) {
  switch (viewType) {
    case 'card':
      return {
        value: 'card',
        label: t('player.view.card'),
        icon: 'grid_view',
      };
    case 'list':
      return {
        value: 'list',
        label: t('player.view.list'),
        icon: 'list',
      };
  }
}

/**
 * uuidを渡したプレイヤーがすでにWorldに登録済みであるか否かを返す
 */
function hasPlayerInWorld(playerUUID?: PlayerUUID) {
  if (mainStore.world && isValid(mainStore.world.players)) {
    return mainStore.world.players.some((wp) => wp.uuid === playerUUID);
  } else {
    return false;
  }
}

/**
 * View形式が変更された際に発火
 */
function onChangedView() {
  playerStore.openGroupEditor = false;
}
</script>

<template>
  <div class="column q-gutter-y-md q-py-md">
    <span class="text-body2" style="opacity: 0.6">
      {{ $t('player.description') }}
    </span>

    <div class="row q-gutter-x-md items-center">
      <SsInput
        v-model="playerStore.searchName"
        dense
        :placeholder="$t('player.search')"
        :debounce="200"
        class="col"
      />

      <SsSelectScope
        dense
        v-model="sysStore.systemSettings.user.viewStyle.player"
        @update:model-value="onChangedView"
        :options="(['list', 'card'] as const).map(createViewMap)"
        options-selected-class="text-primary"
      >
        <template v-slot:option="scope">
          <q-item dense v-bind="scope.itemProps">
            <q-item-section avatar>
              <q-icon :name="scope.opt.icon" />
            </q-item-section>
            <q-item-section>
              {{ scope.opt.label }}
            </q-item-section>
          </q-item>
        </template>
      </SsSelectScope>

      <slot name="btnLine" />
    </div>

    <div class="row">
      <PlayerJoinToggle
        v-if="mainStore.world && isValid(mainStore.world.properties)"
        v-model="mainStore.world.properties"
        class="col"
      />
      <slot name="toggleLine" />
    </div>

    <div v-show="playerStore.searchName !== ''">
      <span class="text-caption">{{ $t('player.newPlayer') }}</span>
      <SearchResultCard
        is-check-player-in-world
        :register-btn-text="$t('player.addPlayer')"
        :register-process="playerStore.addPlayer"
        :player-filter="(pId) => !hasPlayerInWorld(pId)"
      />
    </div>
  </div>
</template>
