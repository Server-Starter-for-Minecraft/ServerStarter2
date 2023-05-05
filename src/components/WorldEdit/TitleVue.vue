<script setup lang="ts">
interface Prop {
  title: string
}

defineProps<Prop>()
</script>

<template>
  <h1>{{ title }}</h1>
</template>

<style scoped lang="scss">
h1 {
  margin-top: 0;
  margin-bottom: 0;
  font-size: 3rem;
}
</style>