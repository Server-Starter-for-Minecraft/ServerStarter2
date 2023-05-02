<script setup lang="ts">
defineProps(['propName'])
</script>

<template>
  <div class="row items-center justify-center q-py-sm">
    <span class="propName q-pa-none col-5">{{ propName }}</span>
    <slot name="userInput" class="col"></slot>
  </div>
</template>

<style scoped lang="scss">
.propName {
  width: 200px;
  font-size: 1.5rem;
}
</style>