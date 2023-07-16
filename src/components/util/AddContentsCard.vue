<script setup lang="ts">
import BaseActionsCard from 'src/components/World/utils/BaseActionsCard.vue';

interface Prop {
  label: string
  minHeight: string
  onClick: () => void
}
defineProps<Prop>()
</script>

<template>
  <BaseActionsCard
    class="card"
    :style="{'min-height': minHeight}"
    @click="onClick"
  >
    <template #default>
      <div
        class="absolute-center row items-center"
        style="width: max-content;"
      >
        <q-icon name="add" size="2rem" class="q-mr-sm"/>
        <span style="font-size: 1rem;">{{ label }}</span>
      </div>
    </template>
  </BaseActionsCard>
</template>

<style scoped lang="scss">
.body--light {
  .card {
    border-color: black;
  }
}

.body--dark {
  .card {
    border-color: white;
  }
}
</style>