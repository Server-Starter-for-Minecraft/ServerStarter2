<script setup lang="ts">
defineProps(['avater', 'version', 'worldName'])
</script>

<template>
<q-item clickable>
  <q-item-section avatar>
    <q-img :src="avater" />
  </q-item-section>
  <q-item-section>{{ worldName }}</q-item-section>
  <q-item-section side>
    <q-item-label caption>{{ version }}</q-item-label>
  </q-item-section>
</q-item>
</template>