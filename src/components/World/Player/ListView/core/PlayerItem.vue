<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { OpLevel } from 'app/src-electron/schema/player';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import { checkError } from 'src/components/Error/Error';
import PlayerHeadAvatar from 'src/components/util/PlayerHeadAvatar.vue';
import OpPanel from './OpPanel.vue';

interface Prop {
  uuid: PlayerUUID;
  opLevel?: OpLevel;
}
const prop = defineProps<Prop>();

const playerStore = usePlayerStore();
const player = ref(playerStore.cachePlayers[prop.uuid]);

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

function onItemClicked() {
  if (playerStore.focusCards.has(prop.uuid)) {
    playerStore.unFocus(prop.uuid);
  } else {
    playerStore.addFocus(prop.uuid);
  }
}

function onRemoveClicked() {
  playerStore.addFocus(prop.uuid);
  playerStore.removePlayer();
}
</script>

<template>
  <q-item
    clickable
    @click="onItemClicked"
    :class="playerStore.focusCards.has(uuid) ? 'selected' : ''"
    class="items-center q-py-xs"
  >
    <q-item-section avatar>
      <PlayerHeadAvatar :player="player" size="1.5rem" />
    </q-item-section>

    <q-item-section>
      <q-item-label class="name">
        {{ player.name }}
      </q-item-label>
    </q-item-section>

    <q-item-section side>
      <div class="row q-gutter-x-md">
        <OpPanel :uuid="uuid" :player-op-level="opLevel" />
        <q-separator vertical />
        <q-btn
          flat
          dense
          size="1rem"
          icon="close"
          color="negative"
          @click="onRemoveClicked"
        />
      </div>
    </q-item-section>
  </q-item>
</template>

<style scoped lang="scss">
.name {
  font-size: 1.2rem;
}

.selected {
  background-color: rgba($color: $primary, $alpha: 0.3);
}
</style>
