<script setup lang="ts">
interface Prop {
  active?: boolean
  label: string
  onClick: () => void
}
defineProps<Prop>()
</script>

<template>
  <q-item
    :active="active"
    clickable
    @click="onClick"
  >
    <q-item-section>{{ label }}</q-item-section>
  </q-item>
</template>