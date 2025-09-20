<script setup lang="ts">
import { onBeforeMount, Ref, ref } from 'vue';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { OpLevel, Player } from 'app/src-electron/schema/player';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import { checkError } from 'src/components/Error/Error';
import PlayerHeadAvatar from 'src/components/util/PlayerHeadAvatar.vue';
import OpPanel from './OpPanel.vue';
import RemovePlayerBtn from './parts/RemovePlayerBtn.vue';

interface Prop {
  uuid: PlayerUUID;
  opLevel?: OpLevel;
}
const prop = defineProps<Prop>();

const playerStore = usePlayerStore();
const player: Ref<undefined | Player> = ref(undefined);

function onItemClicked() {
  if (playerStore.focusCards.has(prop.uuid)) {
    playerStore.unFocus(prop.uuid);
  } else {
    playerStore.addFocus(prop.uuid);
  }
}

// プレイヤーデータをAPIから取得
onBeforeMount(async () => {
  if (player.value === void 0) {
    checkError(
      await window.API.invokeGetPlayer(prop.uuid, 'uuid'),
      (p) => {
        player.value = p;
      },
      undefined
    );
  }
});
</script>

<template>
  <q-item
    clickable
    dense
    @click="onItemClicked"
    :class="playerStore.focusCards.has(uuid) ? 'selected' : ''"
    class="q-pa-xs"
  >
    <q-item-section avatar style="min-width: 0">
      <PlayerHeadAvatar v-if="player !== void 0" :player="player" size="1.2rem" />
      <q-skeleton v-else type="circle" />
    </q-item-section>
    <q-item-section>
      <q-item-label v-if="player !== void 0" class="q-px-sm name text-omit">
        {{ player.name }}
      </q-item-label>
      <q-skeleton v-else type="text" style="width: 6rem" />
    </q-item-section>
    <!-- <q-item-section class="text-right text-caption" style="opacity: .6;">
      <q-item-label class="q-px-sm name text-omit">
        00000000-0000-0000-0000-000000000000
      </q-item-label>
    </q-item-section> -->
    <q-item-section side>
      <OpPanel :uuid="uuid" :player-op-level="opLevel" />
    </q-item-section>
    <q-item-section side>
      <RemovePlayerBtn :uuid="uuid" />
    </q-item-section>
  </q-item>
</template>

<style scoped lang="scss">
.name {
  font-size: 0.9rem;
}

.selected {
  background-color: rgba($color: $primary, $alpha: 0.3);
}
</style>
