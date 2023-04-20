<script setup lang="ts">
import headerVue from 'app/src/components/Main/HeaderVue.vue'
import worldList from 'src/components/Main/WorldListVue.vue'
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
    <worldList/>
  </q-page>
</template>