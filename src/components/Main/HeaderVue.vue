<script setup lang="ts">
import { ref } from 'vue';
import { systemStore } from 'src/stores/SystemStore';
import iconBtn from '../util/iconButton.vue'
import HeaderVue from '../util/HeaderVue.vue';

const autoShutdown = ref(true)
</script>

<template>
  <header-vue
    main-title="Server Starter for Minecraft"
    :side-text="`ver ${systemStore().systemVersion}`"
  >
    <template v-slot:bottomField>
      <q-item class="q-pa-md row">
        <q-item-section>
          <p class="q-pl-md q-pt-lg">IP. {{ systemStore().publicIP }}</p>
          <q-checkbox v-model="autoShutdown">サーバー終了後にPCを自動シャットダウンする</q-checkbox>
        </q-item-section>
        <q-item-section side>
          <icon-btn icon="tune" size="16pt" text="詳細設定" to="settings"/>
        </q-item-section>
      </q-item>
    </template>
  </header-vue>
</template>