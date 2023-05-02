<script setup lang="ts">
defineProps(['propName'])
</script>

<template>
  <div class="row q-py-sm">
    <span class="propName q-pa-none col-">{{ propName }}</span>
    <slot name="userInput"></slot>
  </div>
</template>

<style scoped lang="scss">
.propName {
  width: 13rem;
  font-size: 1.5rem;
}
</style>