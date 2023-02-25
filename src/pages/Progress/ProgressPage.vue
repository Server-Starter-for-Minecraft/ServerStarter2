<script setup lang="ts">
import { getStore } from './ProgressStore';
const store = getStore()
</script>

<template>
  <q-circular-progress
    indeterminate
    size="50px"
    :thickness="0.22"
    rounded
    color="primary"
    track-color="grey-3"
    class="q-ma-md"
  />

  <q>{{ store.message }}</q>
</template>