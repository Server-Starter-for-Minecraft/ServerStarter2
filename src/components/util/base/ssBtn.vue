<script setup lang="ts">
interface Prop {
  label: string
  color?: string
  width?: string
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