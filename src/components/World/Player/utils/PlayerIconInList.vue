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

const playerName = ref('')
onMounted(async () => playerName.value = (await getPlayerName()) ?? '')

async function getPlayerName() {
  const player = await window.API.invokeGetPlayer(prop.uuid, 'uuid')
  return checkError(player, undefined, 'プレイヤーの取得に失敗しました')?.name
}
</script>

<template>
  <q-item>
    <q-item-section>
      <q-avatar square size="2rem" class="full-width">
        <PlayerHeadView :uuid="uuid" size="1.9rem" />
        <q-btn flat rounded dense icon="cancel" size="10px" @click="playerStore.unFocus(uuid)" class="cancelBtn" />
      </q-avatar>
      <q-item-label caption class="text-center q-pt-sm">
        {{ playerName }}
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