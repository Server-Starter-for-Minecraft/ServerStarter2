<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue';
import { getCssVar } from 'quasar';
import { values } from 'app/src-public/scripts/obj/obj';
import { strSort } from 'app/src-public/scripts/obj/objSort';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { assets } from 'src/assets/assets';
import { useSystemStore } from 'src/stores/SystemStore';
import { FrontPlayerGroup } from 'src/stores/SystemStore/converters/playerGroup';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import { checkError } from 'src/components/Error/Error';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import PlayerHeadAvatar from 'src/components/util/PlayerHeadAvatar.vue';
import BaseActionsCard from 'src/components/World/utils/BaseActionsCard.vue';
import GroupBadgeView from './parts/GroupBadgeView.vue';

interface Prop {
  uuid: PlayerUUID;
  opLevel?: 1 | 2 | 3 | 4;
}
const prop = defineProps<Prop>();

const sysStore = useSystemStore();
const playerStore = usePlayerStore();
const player = ref(playerStore.cachePlayers[prop.uuid]);
const isBelongingGroups = computed(
  () => getGroups(sysStore.systemSettings.player.groups).length > 0
);

// キャッシュデータに存在しないプレイヤーが指定された場合はデータの取得を行う
onBeforeMount(async () => {
  if (player.value === void 0) {
    checkError(
      await window.API.invokeGetPlayer(prop.uuid, 'uuid'),
      (p) => {
        player.value = p;
        playerStore.addPlayer(p);
      },
      undefined
    );
  }
});

function onCardClicked() {
  if (playerStore.focusCards.has(prop.uuid)) {
    playerStore.unFocus(prop.uuid);
  } else {
    playerStore.addFocus(prop.uuid);
  }

  if (playerStore.openGroupEditor) {
    playerStore.updateGroup(playerStore.selectedGroupId, (g) => {
      g.players = [...playerStore.focusCards];
      return g;
    });
  }
}

function getGroups(groups: FrontPlayerGroup) {
  return values(groups)
    .filter((g) => g.players.includes(prop.uuid))
    .sort((a, b) => strSort(a.name, b.name));
}
</script>

<template>
  <BaseActionsCard
    v-if="player !== void 0"
    @click="onCardClicked"
    :style="
      playerStore.focusCards.has(prop.uuid)
        ? { 'border-color': getCssVar('primary') }
        : ''
    "
  >
    <template #default>
      <q-item style="height: 5rem; padding: 14px" class="full-width">
        <q-item-section avatar top>
          <PlayerHeadAvatar :player="player" size="2.5rem" />

          <q-item-section top style="max-width: 8rem" class="q-pl-md">
            <q-item-label class="name text-omit">
              {{ player.name }}
              <SsTooltip
                :name="player.name"
                anchor="bottom start"
                self="center start"
              />
            </q-item-label>
            <q-item-label
              v-show="opLevel !== void 0"
              caption
              style="opacity: 0.7"
            >
              {{ $t('player.opLevel') }} {{ opLevel }}
            </q-item-label>
          </q-item-section>
        </q-item-section>

        <q-space />

        <q-avatar square size="2rem" class="absolute-top-right q-ma-md">
          <q-icon size="2rem" :name="assets.svg[`level${opLevel ?? 0}`]()" />
        </q-avatar>
      </q-item>

      <q-card-section v-show="isBelongingGroups" class="q-py-none">
        <div class="q-gutter-xs q-pb-sm" style="width: 12.5rem">
          <template
            v-for="g in getGroups(sysStore.systemSettings.player.groups)"
            :key="g"
          >
            <GroupBadgeView :group-name="g.name" :color="g.color" />
          </template>
        </div>
      </q-card-section>
    </template>
  </BaseActionsCard>
</template>

<style scoped lang="scss">
.name {
  font-size: 1.5rem;
}
</style>
