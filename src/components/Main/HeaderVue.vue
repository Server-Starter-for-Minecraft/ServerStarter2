<script setup lang="ts">
import { ref } from 'vue';
import { systemStore } from 'src/stores/SystemStore';
import { mainStore } from 'src/stores/MainStore';
import iconBtn from '../util/iconButton.vue'

const autoShutdown = ref(true)

mainStore().setHeader(
  'Server Starter for Minecraft',
  { sideText: `ver ${systemStore().systemVersion}`}
)
</script>

<template>
  <q-item class="q-pa-md row expandHeader">
    <q-item-section>
      <p class="q-pl-md q-pt-lg">IP. {{ systemStore().publicIP }}</p>
      <q-checkbox v-model="autoShutdown">サーバー終了後にPCを自動シャットダウンする</q-checkbox>
    </q-item-section>
    <q-item-section side>
      <icon-btn icon="tune" size="16pt" text="詳細設定" to="settings"/>
    </q-item-section>
  </q-item>
</template>

<style scoped lang="scss">
.expandHeader {
  background-color: #1a1a1a;
}
</style>