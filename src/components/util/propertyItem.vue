<script setup lang="ts">
defineProps(['propName'])
</script>

<template>
  <div class="row q-py-sm">
    <p class="propName q-pt-md col-">{{ propName }}</p>
    <slot name="userInput"></slot>
  </div>
</template>

<style scoped lang="scss">
.propName {
  width: 12rem;
  font-size: 1.3rem;
}
</style>