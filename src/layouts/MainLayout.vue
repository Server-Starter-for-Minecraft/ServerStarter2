<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';

const mainStore = useMainStore();
</script>

<template>
  <q-layout view="hHh Lpr rff">
    <q-header class="header">
      <q-toolbar class="q-pa-lg">
        <q-toolbar-title>
          <span class="title">{{ mainStore.mainTitle }}</span>
          <span>{{ mainStore.subTitle }}</span>
        </q-toolbar-title>

        <q-btn
          v-show="mainStore.showMenuBtn"
          flat
          dense
          round
          @click="mainStore.rightDrawerOpen = !mainStore.rightDrawerOpen"
          aria-label="Menu"
          icon="menu"
        />

        <div>{{ mainStore.sideText }}</div>
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
  height: 6rem;
}

.title {
  font-size: 24pt;
}
</style>
