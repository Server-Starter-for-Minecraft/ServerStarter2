<script setup lang="ts">
import { Ref, computed, onMounted, ref } from 'vue';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { Player, PlayerSetting } from 'app/src-electron/schema/player';
import { checkError } from 'src/components/Error/Error';
import { useSystemStore } from 'src/stores/SystemStore';
import PlayerHeadView from './PlayerHeadView.vue';

interface Prop {
  modelValue?: Player
  uuid: PlayerUUID
  onAddPlayer: (name: string, uuid: PlayerUUID, addSystem: boolean) => void
}
const prop = defineProps<Prop>()
const emit = defineEmits(['update:model-value'])

const newPlayerModel = computed({
  get() {
    return prop.modelValue;
  },
  set(newValue) {
    emit('update:model-value', newValue);
  },
})

const sysStore = useSystemStore()
onMounted(async () => {
  if (prop.modelValue === void 0) {
    newPlayerModel.value = await getPlayer()
  }
})

async function getPlayer() {
  const player = await window.API.invokeGetPlayer(prop.uuid, 'uuid')
  return checkError(player, undefined, 'プレイヤーの取得に失敗しました')
}
</script>

<template>
  <!-- nameを指定するのは新規プレイヤーのみ -->
  <!-- 新規と仮定して検索したプレイヤーが登録実績のあるプレイヤーだった場合には表示しない -->
  <q-item>
    <q-item-section avatar>
      <PlayerHeadView v-model="newPlayerModel" :uuid="uuid" />
    </q-item-section>
    <q-item-section top>
      <q-item-label class="name force-one-line">{{ newPlayerModel.name }}</q-item-label>
      <q-item-label caption class="q-pt-xs force-one-line" style="opacity: 0.7;">uuid: {{ newPlayerModel.uuid }}</q-item-label>
    </q-item-section>
    <q-item-section side>
      <!-- playerDataが渡されるときは新プレイヤーの時のみのため -->
      <q-btn
        outline
        rounded
        label="このプレイヤーを追加"
        icon="add"
        color="primary"
        @click="onAddPlayer(newPlayerModel.name, newPlayerModel.uuid, modelValue !== void 0)"
      />
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