<script setup>
import { useConsoleStore } from 'src/dummy/stores/console';

const consoleStore = useConsoleStore();
</script>
<template>
  <div
    class="column justify-between"
    style="height: 100%; background-color: lightgray"
  >
    <div>
      <q-tabs v-model="consoleStore.selectedChannel" vertical class="text-teal">
        <div
          v-for="[k, v] in Object.entries(consoleStore.consoles).reverse()"
          :key="k"
        >
          <q-tab :name="k" :label="v.type" />
        </div>
      </q-tabs>
    </div>
    <q-space />
    <q-btn
      flat
      icon="add"
      @click="(e) => consoleStore.addConsole({ type: 'invoke', values: [] })"
    >
      コンソールを追加
    </q-btn>
  </div>
</template>
