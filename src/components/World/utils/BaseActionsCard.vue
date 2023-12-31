<script setup lang="ts">
interface Prop {
  onClick?: () => void
}
defineProps<Prop>()
</script>

<template>
  <q-card
    flat
    bordered
    class="fit card chamfer"
  >
    <q-item
      dense
      :clickable="onClick !== void 0"
      @click="onClick"
      class="q-pa-none column fit chamfer"
      style="color: inherit; border-radius: 15px;"
    >
      <slot />
    </q-item>
    
    <slot name="actions" />
  </q-card>
</template>

<style scoped lang="scss">
.card {
  min-width: 14rem;
  max-width: 14rem;
}

.chamfer {
  border-radius: 15px;
}
</style>