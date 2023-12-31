<script setup lang="ts">
import BaseActionsCard from 'src/components/World/utils/BaseActionsCard.vue';

interface Prop {
  label: string
  minHeight: string
  cardStyle?: Record<string, string | null>
  onClick: () => void
}
defineProps<Prop>()
</script>

<template>
  <BaseActionsCard
    class="card bg-transparent"
    :style="{...cardStyle, 'min-height': minHeight}"
    @click="onClick"
  >
    <template #default>
      <div
        class="justify-center row items-center fit"
        :style="{'width': 'max-content', 'min-height': minHeight}"
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