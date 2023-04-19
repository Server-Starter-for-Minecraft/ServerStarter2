<script setup lang="ts">
defineProps(['propName'])
</script>

<template>
  <div class="row items-center justify-left q-py-sm" style="width: 100%;">
    <span class="propName q-pa-none col-5">{{ propName }}</span>
    <slot name="userInput" class="col"></slot>
  </div>
</template>

<style scoped lang="scss">
.propName {
  width: 200px;
  font-size: 16pt;
}
</style>