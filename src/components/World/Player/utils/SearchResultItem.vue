<script setup lang="ts">
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { checkError } from 'src/components/Error/Error';
import PlayerHeadView from './PlayerHeadView.vue';

interface Prop {
  uuid: PlayerUUID
  name?: string
}
const prop = defineProps<Prop>()

function addPlayer() {
  // TODO: システムとWorldのPlayersに対して追加処理を記述
}

async function getName() {
  if (prop.name !== void 0) {
    return prop.name
  }

  const player = await window.API.invokeGetPlayer(prop.uuid, 'uuid')
  return checkError(player, undefined, 'プレイヤーの取得に失敗しました')?.name
}
</script>

<template>
  <q-item>
    <q-item-section avatar>
      <PlayerHeadView :uuid="uuid" />
    </q-item-section>
    <q-item-section top>
      <q-item-label class="name force-one-line">{{ getName() }}</q-item-label>
      <q-item-label caption class="q-pt-xs force-one-line" style="opacity: 0.7;">uuid: {{ uuid }}</q-item-label>
    </q-item-section>
    <q-item-section side>
      <q-btn outline rounded label="このプレイヤーを追加" icon="add" color="primary" />
    </q-item-section>
  </q-item>
</template>

<style scoped lang="scss">
.force-one-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.name {
  font-size: 1.3rem;
}
</style>