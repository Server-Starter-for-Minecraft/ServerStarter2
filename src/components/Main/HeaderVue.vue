<script setup lang="ts">
import { ref } from 'vue';
import iconBtn from 'app/src/components/util/iconButton.vue'
import { systemStore } from 'src/stores/SystemStore';
const autoShutdown = ref(true)
</script>

<template>
  <q-header class="header">
    <q-toolbar class="q-pa-lg">
      <q-toolbar-title>
        <span class="title">Server Starter for Minecraft</span>
      </q-toolbar-title>

      <div>ver {{ systemStore().systemVersion }}</div>
    </q-toolbar>

    <q-item class="q-pa-md row">
      <q-item-section>
        <p class="q-pl-md q-pt-lg">IP. {{ systemStore().publicIP }}</p>
        <q-checkbox v-model="autoShutdown">サーバー終了後にPCを自動シャットダウンする</q-checkbox>
      </q-item-section>
      <q-item-section side>
        <icon-btn icon="tune" size="16pt" text="詳細設定"/>
      </q-item-section>
    </q-item>
  </q-header>
</template>

<style scoped lang="scss">
.header {
  background-color: #1a1a1a;
  height: 230px;
}
.title {
  font-size: 24pt;
}
</style>