<script setup>
import { useConsoleStore } from 'src/stores/console';
const console = useConsoleStore();
</script>
<template>
  <div
    class="column justify-between"
    style="height: 100%; background-color: lightgray"
  >
    <div>
      <q-tabs v-model="console.selectedChannel" vertical class="text-teal">
        <div v-for="[k, v] in Object.entries(console.consoles).reverse()" :key="k">
          <q-tab :name="k" :label="v.type" />
        </div>
      </q-tabs>
    </div>
    <q-space />
    <q-btn
      flat
      icon="add"
      @click="(e) => console.addConsole({ type: 'invoke', values: [] })"
    >
      コンソールを追加
    </q-btn>
  </div>
</template>
