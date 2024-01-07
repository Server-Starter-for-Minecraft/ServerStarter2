<script setup lang="ts">
interface Prop {
  icon: string
  label: string
  color?: string
  disable?: boolean
  onClick: () => void
}
defineProps<Prop>()
</script>

<template>
  <q-btn
    dense
    outline
    stack
    :disable="disable"
    :color="color"
    :icon="icon"
    @click="onClick"
    style="width: 4rem; height: 4rem;"
  >
    <span class="ImgSelectBtn">{{ label }}</span>
  </q-btn>
</template>

<style scoped lang="scss">
.ImgSelectBtn {
  font-size: 10px;
  margin-bottom: -5px;
}
</style>