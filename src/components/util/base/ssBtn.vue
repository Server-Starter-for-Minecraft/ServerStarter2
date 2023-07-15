<script setup lang="ts">
interface Prop {
  label: string
  dense?: boolean
  color?: string
  width?: string
  disable?: boolean
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
    @click="onClick"
    :style="{ 'width': width ?? '13rem' }"
  />
</template>