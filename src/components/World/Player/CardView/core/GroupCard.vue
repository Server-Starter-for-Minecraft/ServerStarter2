<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { isValid } from 'app/src-public/scripts/error';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { Player } from 'app/src-electron/schema/player';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import PlayerHeadAvatar from 'src/components/util/PlayerHeadAvatar.vue';
import BaseActionsCard from 'src/components/World/utils/BaseActionsCard.vue';

interface Prop {
  name: string;
  color: string;
  players: PlayerUUID[];
  onEdit: () => void;
}
const prop = defineProps<Prop>();

const playerStore = usePlayerStore();
const showMenuBtn = ref(false);
const menuOpened = ref(false);
const loadedPlayers = ref<Player[] | undefined>(undefined);

function onCardClicked() {
  playerStore.selectGroup(prop.name);
}

function onEditClicked() {
  if (loadedPlayers.value === void 0) return;
  loadedPlayers.value.forEach((p) => playerStore.addFocus(p));
  prop.onEdit();
}

onMounted(async () => {
  // プレイヤーデータをAPIから取得
  const tmpPlayers = await Promise.all(
    prop.players.map((uuid) => window.API.invokeGetPlayer(uuid, 'uuid'))
  );
  loadedPlayers.value = tmpPlayers.filter(isValid);
});
</script>

<template>
  <BaseActionsCard
    @mouseover="showMenuBtn = true"
    @mouseout="showMenuBtn = false"
    @click="onCardClicked"
  >
    <template #default>
      <q-card-section
        class="fit q-pt-xs"
        :style="{
          'border-left': `1rem solid ${color}`,
          'border-radius': '15px',
        }"
      >
        <div
          v-if="showMenuBtn || menuOpened"
          style="width: calc(100% - 3.5rem)"
        >
          <div class="groupName text-omit">
            {{ name }}
            <SsTooltip :name="name" anchor="bottom start" self="center start" />
          </div>
        </div>
        <div v-else>
          <div class="groupName text-omit">
            {{ name }}
            <SsTooltip :name="name" anchor="bottom start" self="center start" />
          </div>
        </div>
        <!-- TODO: 大量のプレイヤーが存在する（カードの高さが一定以上になる？）場合には折り畳みにすることを検討？ -->
        <div class="row q-gutter-md q-pt-sm">
          <template v-if="loadedPlayers !== void 0">
            <template v-for="p in loadedPlayers" :key="p.uuid">
              <PlayerHeadAvatar :player="p" size="1.5rem" />
            </template>
          </template>
          <q-skeleton
            v-else
            v-for="n in players.length"
            :key="n"
            type="rect"
            style="height: 1.5rem; width: 1.5rem"
          />
        </div>
      </q-card-section>
    </template>

    <template #actions>
      <SsBtn
        v-show="showMenuBtn || menuOpened"
        dense
        :label="$t('general.edit')"
        width="3rem"
        class="q-mt-sm q-mr-sm absolute-top-right"
        @click="onEditClicked"
      />
    </template>
  </BaseActionsCard>
</template>

<style scoped lang="scss">
.groupName {
  font-size: 1.5rem;
}
</style>
