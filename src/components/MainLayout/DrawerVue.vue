<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';

const store = useMainStore();
</script>

<template>  
  <q-drawer
    v-model="store.leftDrawerOpen"
    :mini="$q.screen.lt.md"
    :width="300"
    :breakpoint="100"
    bordered
    :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-3'"
  >
  </q-drawer>
</template>