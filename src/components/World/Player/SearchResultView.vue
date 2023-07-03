<script setup lang="ts">
import { Ref, computed, onMounted, ref } from 'vue';
import { Player, PlayerSetting } from 'app/src-electron/schema/player';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabsStore';
import { isValid } from 'src/scripts/error';
import SearchResultItem from './utils/SearchResultItem.vue';
import { PlayerUUID } from 'app/src-electron/schema/brands';

interface Prop {
  modelValue: PlayerSetting[]
}
const prop = defineProps<Prop>()
const emit = defineEmits(['update:model-value'])

const sysStore = useSystemStore()
const playerStore = usePlayerStore()

const newPlayerCandidate: Ref<Player | undefined> = ref()

const playerModel = computed({
  get() {
    return prop.modelValue;
  },
  set(newValue) {
    emit('update:model-value', newValue);
  },
})

async function getNewPlayer(searchName: string) {
  const player = await window.API.invokeGetPlayer(searchName, 'name')
  newPlayerCandidate.value = isValid(player) ? player : undefined
  return newPlayerCandidate.value
}

function addPlayer(name: string, uuid: PlayerUUID, addSystem = false) {
  // worldのプレイヤー一覧に追加
  playerModel.value.push({
    name: name,
    uuid: uuid,
  })

  if (addSystem) {
    sysStore.systemSettings().player.players.push(uuid)
  }
}
</script>

<template>
  <q-card flat bordered class="card q-ma-sm">
    <!-- TODO: v-ifに候補が0でないことの条件式を入れる -->
    <q-card-section
      v-if="(sysStore.systemSettings().player.players.filter(uuid => playerModel.find(p => p.uuid === uuid) === undefined).length + (getNewPlayer(playerStore.searchName) !== void 0 ? 1 : 0)) !== 0"
      class="q-pa-sm"
    >
      <q-list separator>
        <!-- プレイヤー名からプレイヤーの検索を行う -->
        <SearchResultItem v-if="newPlayerCandidate !== void 0" v-model="playerModel" :uuid="newPlayerCandidate?.uuid" :player-data="newPlayerCandidate" @add-player="addPlayer" />
        <!-- 過去に登録実績のあるプレイヤー一覧 -->
        <template v-for="uuid in sysStore.systemSettings().player.players.filter(uuid => playerModel.find(p => p.uuid === uuid) === undefined)" :key="uuid">
          <SearchResultItem v-model="playerModel" :uuid="uuid" @add-player="addPlayer" />
        </template>
      </q-list>
    </q-card-section>
    <q-card-section v-else>
      <p class="q-my-xs text-center">検索結果無し</p>
    </q-card-section>
  </q-card>
</template>

<style scoped lang="scss">
.card {
  // TODO: lightモードに対応
  border-color: white;
  border-radius: 15px;
}
</style>