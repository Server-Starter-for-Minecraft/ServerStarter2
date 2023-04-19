<script setup lang="ts">
import headerVue from 'app/src/components/Main/HeaderVue.vue'
import worldListVue from 'app/src/components/Main/WorldListVue.vue'
import { useRouter } from 'vue-router';

// コードからRouterへアクセス
const router = useRouter();
const goConsole = async () => {
  await router.replace('console');
};

window.API.onStartServer((_: Electron.IpcRendererEvent) => goConsole());
</script>

<template>
  
  <!-- 230はHeader-vueの高さ -->
  <q-page>
    <div class="column" style="height: calc(100vh - 80px);">
      <header-vue/>

      <div class="col">
        <world-list-vue/>
        <!-- <template v-for="text in Array(100)" :key="text">
          a<br/>
        </template> -->
      </div>
    </div>
  </q-page>
</template>