<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import { checkError } from 'src/components/Error/Error';
import PlayerHeadView from '../utils/PlayerHeadView.vue';

interface Prop {
  modelValue: PlayerUUID[]
  uuid: PlayerUUID
}
const prop = defineProps<Prop>()
const emit = defineEmits(['update:model-value'])

const membersModel = computed({
  get() {
    return prop.modelValue;
  },
  set(newValue) {
    emit('update:model-value', newValue);
  },
})

const showDeleteBtn = ref(false)

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

function removePlayer() {
  membersModel.value.splice(membersModel.value.indexOf(prop.uuid), 1)
}
</script>

<template>
  <q-item
    @mouseover="showDeleteBtn = true"
    @mouseout="showDeleteBtn = false"
  >
    <q-item-section avatar>
      <PlayerHeadView v-model="player" size="1.5rem" />
    </q-item-section>

    <q-item-section>{{ player.name }}</q-item-section>

    <!-- プレイヤー数が１より大きい時にはプレイヤーが削除されてもOKだが、1人の時は削除できないようにする -->
    <q-item-section side>
      <q-btn
        v-show="showDeleteBtn && membersModel.length > 1"
        flat
        dense
        size=".7rem"
        icon="do_not_disturb_on"
        color="red"
        @click="removePlayer"
      />
    </q-item-section>
  </q-item>
</template>