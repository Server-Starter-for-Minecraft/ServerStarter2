<script setup lang="ts">
import { Ref, computed, ref } from 'vue';
import { Player, PlayerSetting } from 'app/src-electron/schema/player';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { usePlayerStore } from 'src/stores/WorldTabsStore';
import { isValid } from 'src/scripts/error';
import SearchResultItem from './utils/SearchResultItem.vue';
import StaticSearchResultItem from './utils/StaticSearchResultItem.vue';

interface Prop {
  modelValue: PlayerSetting[]
}
const prop = defineProps<Prop>()
const emit = defineEmits(['update:model-value'])

const sysStore = useSystemStore()
const mainStore = useMainStore()
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
        <SearchResultItem
          v-if="newPlayerCandidate !== void 0"
          v-model="newPlayerCandidate"
        />
        <!-- 過去に登録実績のあるプレイヤー一覧 -->
        <template v-for="p in playerStore.searchPlayers(
            Object.values(playerStore.cachePlayers).filter(cp => {
              if (isValid(mainStore.world.players)) {
                return !(mainStore.world.players.some(p => p.uuid === cp.uuid) || cp.name === playerStore.searchName)
              }
              else {
                return true
              }
            })
          )"
          :key="p"
        >
          <StaticSearchResultItem :player="p"/>
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