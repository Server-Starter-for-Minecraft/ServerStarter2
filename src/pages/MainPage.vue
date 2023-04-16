<script setup lang="ts">
import headerVue from 'app/src/components/Main/HeaderVue.vue'
import worldListVue from 'app/src/components/Main/WorldListVue.vue'
import { useRouter } from 'vue-router';

// コードからRouterへアクセス
const router = useRouter();
const goConsole = async () => {
  await router.push('console');
};

window.API.onStartServer((_: Electron.IpcRendererEvent) => goConsole());
</script>

<template>
  <header-vue/>

  <!-- 230はHeader-vueの高さ -->
  <div style="height: calc(100vh - 230pt)">
    <world-list-vue/>
  </div>
</template>