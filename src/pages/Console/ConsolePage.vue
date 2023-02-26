<script setup lang="ts">
import { addConsole, getStore } from './ConsoleStore';

const items = getStore()
window.ConsoleAPI.onAddConsole((_event, value) => {
  addConsole(value[0])
})
</script>

<template>
  <div class="q-pa-md">
    <q-scroll-area style="height: 80vh; background-color: gray;">
      <div v-for="item in items.console" :key="item" style="font-size: 90px;">
        <li>{{ item }}</li>
      </div>
    
    </q-scroll-area>
  </div>
</template>