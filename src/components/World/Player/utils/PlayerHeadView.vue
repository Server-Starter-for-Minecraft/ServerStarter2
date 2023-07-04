<script setup lang="ts">
import { Ref, computed, onMounted, ref } from 'vue';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { Player } from 'app/src-electron/schema/player';
import { checkError } from 'src/components/Error/Error';

interface Prop {
  modelValue?: Player
  size?: string
  uuid: PlayerUUID
}
const prop = defineProps<Prop>()
const emit = defineEmits(['update:model-value'])

let playerModel = computed({
  get() {
    return prop.modelValue;
  },
  set(newValue) {
    emit('update:model-value', newValue);
  },
})

const player = ref()
onMounted(async () => {
  if (prop.modelValue === void 0) {
    player.value = await getPlayerName()
  }
})

async function getPlayerName() {
  const player = await window.API.invokeGetPlayer(prop.uuid, 'uuid')
  return checkError(player, undefined, 'プレイヤーの取得に失敗しました')
}
</script>

<template>
  <q-avatar v-if="playerModel !== void 0" square :size="size">
    <q-img :src="playerModel?.avatar" class="avaterImg" />
    <q-img :src="playerModel?.avatar_overlay" class="avaterImg" style="width: 110%;" />
  </q-avatar>
  <q-avatar v-else square :size="size">
    <q-img :src="player?.avatar" class="avaterImg" />
    <q-img :src="player?.avatar_overlay" class="avaterImg" style="width: 110%;" />
  </q-avatar>
</template>

<style scoped lang="scss">
.avaterImg {
  position: absolute;
  image-rendering: pixelated;
}
</style>