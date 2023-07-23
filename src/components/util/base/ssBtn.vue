<script setup lang="ts">
interface Prop {
  label?: string
  dense?: boolean
  color?: string
  width?: string
  freeWidth?: boolean
  disable?: boolean
  isCapital?: boolean
  onClick: () => void
}
defineProps<Prop>()
</script>

<template>
  <q-btn
    outline
    :dense="dense"
    :label="label"
    :color="color"
    :disable="disable"
    :no-caps="!isCapital"
    @click="onClick"
    :style="{ 'width': freeWidth ? '' : (width ?? '13rem') }"
  >
    <slot />
  </q-btn>
</template>