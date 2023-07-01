<script setup lang="ts">
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { useSystemStore } from 'src/stores/SystemStore';
import PlayerHeadView from './PlayerHeadView.vue';
import { usePlayerStore } from 'src/stores/WorldTabsStore';

interface Prop {
  uuid: PlayerUUID
}
const prop = defineProps<Prop>()

const sysStore = useSystemStore()
const playerStore = usePlayerStore()

const playerData = sysStore.systemSettings().player.players[prop.uuid]
</script>

<template>
  <q-item>
    <q-item-section>
      <q-avatar square size="2rem" class="full-width">
        <PlayerHeadView :uuid="playerData" size="1.9rem" />
        <q-btn flat rounded dense icon="cancel" size="10px" @click="playerStore.unFocus(uuid)" class="cancelBtn" />
      </q-avatar>
      <q-item-label caption class="text-center q-pt-sm">
        {{ playerData.name }}
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