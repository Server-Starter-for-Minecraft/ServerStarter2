<script setup lang="ts">
import { progressStore } from './ProgressStore';
const message = progressStore().message
</script>

<template>
  <q-page>
    <q-circular-progress
      indeterminate
      size="50px"
      :thickness="0.22"
      rounded
      color="primary"
      track-color="grey-3"
      class="q-ma-md"
    />

    <q>{{ message }}</q>
  </q-page>
</template>