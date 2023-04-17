<script setup lang="ts">
import { mainStore } from 'src/stores/MainStore'

const store = mainStore()
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="header">
      <q-toolbar class="q-pa-lg">
        <q-toolbar-title>
          <span class="title">{{ store.mainTitle }}</span>
          <span>{{ store.subTitle }}</span>
        </q-toolbar-title>

        <div>{{ store.sideText }}</div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style scoped lang="scss">
.header {
  background-color: #1a1a1a;
}

.title {
  font-size: 24pt;
}
</style>