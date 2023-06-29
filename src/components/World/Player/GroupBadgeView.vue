<script setup lang="ts">
interface Prop {
  groupName: string
  color: string
}
defineProps<Prop>()

function onClicked() {
  console.log('TEST')
}
</script>

<template>
  <q-chip
    square
    dense
    outline
    clickable @click="onClicked"
  >
    <q-icon name="circle" :color="color"/>
    <span class="name">{{ groupName }}</span>
  </q-chip>
</template>

<style scoped lang="scss">
.name {
  max-width: 12rem;
  white-space: nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
</style>