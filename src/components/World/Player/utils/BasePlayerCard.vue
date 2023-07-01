<script setup lang="ts">
interface Prop {
  onClick: () => void
}
defineProps<Prop>()
</script>

<template>
  <q-card
    flat
    bordered
    class="fit card"
  >
    <slot />

    <div class="absolute-top fit">
      <q-btn flat color="transparent" @click="onClick" class="fit card"/>
    </div>

    <slot name="actions" />
  </q-card>
</template>

<style scoped lang="scss">
.card {
  min-width: 14rem;
  max-width: 14rem;
  border-radius: 15px;
}
</style>