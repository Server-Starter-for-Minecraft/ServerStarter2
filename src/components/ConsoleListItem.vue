<script setup lang="ts">
const props = defineProps<{
  channel: number;
}>();
</script>
<template>
  <q-btn spread flat color="pink" class="maxwidth">
    コンソール{{ props.channel }}
  </q-btn>
</template>
