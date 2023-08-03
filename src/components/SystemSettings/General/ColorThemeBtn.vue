<script setup lang="ts">
interface Prop {
  src: string
  active?: boolean
  label: string
  onClick: () => void
}
defineProps<Prop>()
</script>

<template>
  <q-btn
    dense
    outline
    :color="active ? 'primary' : 'transparent'"
    @click="onClick"
  >
    <q-avatar square size="3rem" class="q-ma-xs">
      <q-icon size="3rem" :name="src" />
    </q-avatar>

    <q-tooltip class="text-body2">
      {{ label }}
    </q-tooltip>
  </q-btn>
</template>