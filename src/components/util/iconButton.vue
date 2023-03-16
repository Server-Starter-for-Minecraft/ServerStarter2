<script setup lang="ts">
defineProps(['icon', 'text', 'color'])
</script>

<template>
  <q-btn flat :icon="icon" :color="color">
    <span class="gt-md">{{ text }}</span>
    <q-tooltip :offset="[10, 10]" class="text-body2 lt-md">{{ text }}</q-tooltip>
  </q-btn>
</template>