<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import { checkError } from 'src/components/Error/Error';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import PlayerHeadAvatar from 'src/components/util/PlayerHeadAvatar.vue';

interface Prop {
  uuid: PlayerUUID;
}
const prop = defineProps<Prop>();

const playerStore = usePlayerStore();
const player = ref(playerStore.cachePlayers[prop.uuid]);

// キャッシュデータに存在しないプレイヤーが指定された場合はデータの取得を行う
onMounted(async () => {
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
</script>

<template>
  <q-item class="q-px-none" style="width: 3rem">
    <q-item-section>
      <q-avatar square size="2rem" class="full-width">
        <PlayerHeadAvatar :player="player" size="1.9rem" />
        <q-btn
          flat
          rounded
          dense
          icon="cancel"
          size="10px"
          @click="playerStore.unFocus(uuid)"
          class="cancelBtn"
        />
      </q-avatar>
      <q-item-label class="text-center q-pt-xs text-omit">
        {{ player.name }}
      </q-item-label>
    </q-item-section>
    <SsTooltip :name="player.name" anchor="center middle" self="top middle" />
  </q-item>
</template>

<style scoped lang="scss">
.cancelBtn {
  position: absolute;
  top: -9px;
  right: -5px;
}
</style>
