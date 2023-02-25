<script setup lang="ts">
import { getStore } from './ConsoleStore';

const items = getStore()
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