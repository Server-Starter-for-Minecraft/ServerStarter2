<script setup lang="ts">
import headerVue from 'app/src/components/Main/HeaderVue.vue'
import worldListVue from 'app/src/components/Main/WorldListVue.vue'
import { Version } from 'app/src-electron/core/server/version/version';
import { World } from 'app/src-electron/core/server/world/world';
import { useRouter } from 'vue-router';

window.API.onStartServer((_: Electron.IpcRendererEvent) => goConsole());

async function runServer(world: World) {
  goProgress();
  await window.API.runServer(world);
}

// Demo用
const world = new World('testWorld', new Version('Vanilla', '1.0.0'));

// コードからRouterへアクセス
const router = useRouter();
const goConsole = async () => {
  await router.push('console');
};
const goProgress = async () => {
  await router.push('progress');
};
</script>

<template>
  <header-vue/>

  <!-- 230はHeader-vueの高さ -->
  <div style="height: calc(100vh - 230pt)">
    <world-list-vue/>
    <q-btn @click="runServer(world)">Run Server</q-btn>
  </div>
</template>