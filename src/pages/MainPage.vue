<script setup lang="ts">
import headerVue from 'app/src/components/Main/HeaderVue.vue'
import worldOperation from 'app/src/components/Main/WorldOperationVue.vue'
import worldList from 'app/src/components/Main/WorldListVue.vue'
import { useRouter } from 'vue-router';

// コードからRouterへアクセス
const router = useRouter();
const goConsole = async () => {
  await router.replace('console');
};

window.API.onStartServer((_: Electron.IpcRendererEvent) => goConsole());
</script>

<template>
  <q-page class="column">
    <header-vue/>
    <worldOperation/>
    <worldList/>
  </q-page>
</template>