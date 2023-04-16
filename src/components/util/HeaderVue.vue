<script setup lang="ts">
interface Props {
  mainTitle: string
  subTitle?: string
  sideText?: string
}
defineProps<Props>()
</script>

<template>
  <q-header class="header">
    <q-toolbar class="q-pa-lg">
      <q-toolbar-title>
        <span class="title">{{ mainTitle }}</span>
        <span>{{ subTitle }}</span>
      </q-toolbar-title>

      <div>{{ sideText }}</div>
    </q-toolbar>

    <slot name="bottomField"/>
  </q-header>
</template>

<style scoped lang="scss">
.header {
  background-color: #1a1a1a;
}

.title {
  font-size: 24pt;
}
</style>