<script setup lang="ts">
const props = defineProps<{
  channel: string;
}>();
</script>
<template>
  <q-btn spread flat color="pink" class="maxwidth">
    <span v-if="props.channel === 'on'"> On </span>
    <span v-else-if="props.channel === 'handle'"> Handle </span>
    <span v-else> Invoke </span>
  </q-btn>
</template>
