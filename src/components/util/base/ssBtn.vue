<script setup lang="ts">
interface Prop {
  icon?: string
  label?: string
  dense?: boolean
  color?: string
  width?: string
  freeWidth?: boolean
  disable?: boolean
  loading?: boolean
  isCapital?: boolean
  onClick: () => void
}
defineProps<Prop>()
</script>

<template>
  <q-btn
    outline
    :dense="dense"
    :icon="icon"
    :label="label"
    :color="color"
    :disable="disable"
    :loading="loading"
    :no-caps="!isCapital"
    @click="onClick"
    :style="{ 'width': freeWidth ? '' : (width ?? '13rem') }"
  >
    <slot />
  </q-btn>
</template>