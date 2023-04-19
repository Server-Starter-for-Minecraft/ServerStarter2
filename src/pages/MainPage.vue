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
    
    <!-- <div class="bg-red q-pa-md">BAR-1</div>
    <div class="bg-green q-pa-md">BAR-2</div>
    <q-virtual-scroll
        class="bg-yellow"
        :items="[0,0,0,0,0,0,0,0,0,0]"
        v-slot="{ item, index }"
        style="flex: 1 1 0"
    >
      <div class="text-h1">{{item}}{{ index }}</div>
    </q-virtual-scroll> -->
  </q-page>
</template>