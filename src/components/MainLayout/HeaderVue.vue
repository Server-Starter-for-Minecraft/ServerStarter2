<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';

const mainStore = useMainStore();
</script>

<template>
  <q-header class="header">
      <q-toolbar class="q-pa-lg">
        <q-btn
          v-show="mainStore.showMenuBtn"
          flat
          dense
          round
          @click="mainStore.leftDrawerOpen = !mainStore.leftDrawerOpen"
          aria-label="Menu"
          icon="menu"
          size="20px"
        />

        <q-toolbar-title>
          <span class="title">{{ mainStore.mainTitle }}</span>
          <span>{{ mainStore.subTitle }}</span>
        </q-toolbar-title>

        <div>{{ mainStore.sideText }}</div>
      </q-toolbar>
    </q-header>
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