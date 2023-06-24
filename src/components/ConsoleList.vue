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
        <div v-for="k in Object.keys(console.consoles)" :key="k">
          <q-tab :name="k" :label="'コンソール' + k" />
        </div>
      </q-tabs>
    </div>
    <q-space />
    <q-btn flat icon="add" @click="console.addChannel">
      コンソールを追加
    </q-btn>
  </div>
</template>
