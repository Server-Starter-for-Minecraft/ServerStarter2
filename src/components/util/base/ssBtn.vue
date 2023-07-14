<script setup lang="ts">
interface Prop {
  label: string
  color?: string
  width?: number
  onClick: () => void
}
defineProps<Prop>()
</script>

<template>
  <q-btn
    outline
    :label="label"
    :color="color"
    @click="onClick"
    :style="{ 'width': width ?? '13rem' }"
  />
</template>