<script setup lang="ts">
import WorldPage from 'src/pages/WorldPage.vue';
import { useSystemStore } from 'src/stores/SystemStore';
import WorldList from 'src/components/MainLayout/WorldList.vue';

const sysStore = useSystemStore();
const minLeftWidth = 115;
const maxLeftWidth = 400;
</script>

<template>
  <q-layout view="lHr Lpr lfr">
    <q-splitter
      v-model="sysStore.systemSettings.user.drawerWidth"
      :limits="[minLeftWidth, maxLeftWidth]"
      unit="px"
      emit-immediately
      style="height: 100vh; width: 100vw"
    >
      <template #before>
        <WorldList :min-width="minLeftWidth" :max-width="maxLeftWidth" />
      </template>
      <template #after>
        <WorldPage />
      </template>
    </q-splitter>
  </q-layout>
</template>
