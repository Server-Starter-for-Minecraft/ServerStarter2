<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { isValid } from 'app/src-public/scripts/error';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { Player } from 'app/src-electron/schema/player';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import BaseActionsCard from 'src/components/World/utils/BaseActionsCard.vue';
import PlayerIcon from '../../utils/PlayerIcon.vue';

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
        <div v-if="loadedPlayers !== void 0" class="row q-gutter-md q-pt-sm">
          <template v-for="p in loadedPlayers" :key="uuid">
            <PlayerIcon :player="p" head-size="1.5rem" />
          </template>
        </div>
        <q-skeleton v-else v-for="n in 3" type="circle" />
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
