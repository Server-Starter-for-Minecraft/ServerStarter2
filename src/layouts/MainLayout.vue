<script setup lang="ts">
import { useSystemStore } from 'src/stores/SystemStore';
import WorldList from 'src/components/MainLayout/WorldList.vue';
import WorldPage from 'src/pages/WorldPage.vue';

const sysStore = useSystemStore()
</script>

<template>
  <q-layout view="hHh Lpr rff">
    <div class="row">
      <q-splitter
        v-model="sysStore.systemSettings().user.drawerWidth"
        :limits="[100, 400]"
        unit="px"
        emit-immediately
        style="height: 100vh; width: 100vw;"
      >
        <template #before>
          <WorldList/>
        </template>
        <template #after>
          <WorldPage />
        </template>
      </q-splitter>
    </div>
  </q-layout>
</template>
