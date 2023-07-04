<script setup lang="ts">
import { computed } from 'vue';
import { Player } from 'app/src-electron/schema/player';

interface Prop {
  modelValue: Player
  size?: string
}
const prop = defineProps<Prop>()
const emit = defineEmits(['update:model-value'])

const playerModel = computed({
  get() {
    return prop.modelValue;
  },
  set(newValue) {
    emit('update:model-value', newValue);
  },
})
</script>

<template>
  <q-avatar square :size="size">
    <q-img :src="playerModel.avatar" class="avaterImg" />
    <q-img :src="playerModel.avatar_overlay" class="avaterImg" style="width: 110%;" />
  </q-avatar>
</template>

<style scoped lang="scss">
.avaterImg {
  position: absolute;
  image-rendering: pixelated;
}
</style>