<script setup lang="ts">
import { getStore, setStatus } from './ProgressStore';
const store = getStore()

window.ProgressAPI.onUpdateStatus((_event, value) => {
  setStatus(value[0])
})
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

  <h1>{{ store.message }}</h1>
</template>