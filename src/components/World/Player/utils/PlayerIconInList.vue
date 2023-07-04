<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { checkError } from 'src/components/Error/Error';
import { usePlayerStore } from 'src/stores/WorldTabsStore';
import PlayerHeadView from './PlayerHeadView.vue';

interface Prop {
  uuid: PlayerUUID
}
const prop = defineProps<Prop>()

const playerStore = usePlayerStore()
const player = ref(playerStore.cachePlayers[prop.uuid])

// キャッシュデータに存在しないプレイヤーが指定された場合はデータの取得を行う
onMounted(async () => {
  if (player.value === void 0) {
    checkError(
      await window.API.invokeGetPlayer(prop.uuid, 'uuid'),
      p => {
        player.value = p
        playerStore.addPlayer(p)
      }
    )
  }
})
</script>

<template>
  <q-item>
    <q-item-section>
      <q-avatar square size="2rem" class="full-width">
        <PlayerHeadView v-model="player" size="1.9rem" />
        <q-btn flat rounded dense icon="cancel" size="10px" @click="playerStore.unFocus(uuid)" class="cancelBtn" />
      </q-avatar>
      <q-item-label caption class="text-center q-pt-sm">
        {{ player.name }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<style scoped lang="scss">
.cancelBtn {
  position: absolute;
  top: -9px;
  right: -11px;
}
</style>