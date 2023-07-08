<script setup lang="ts">
interface Prop {
  icon: string
}
defineProps<Prop>()
</script>

<template>
  <q-btn dense flat color="grey" size="1.1rem" :icon="icon" class="btn"/>
</template>

<style scoped lang="scss">
.btn {
  border-bottom-right-radius: 15px;
}
</style>