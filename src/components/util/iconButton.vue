<script setup lang="ts">
interface Props {
  icon: string
  text: string
  color?: string
  size?: string
  to?: string
}
defineProps<Props>()
</script>

<template>
  <q-btn flat :icon="icon" :color="color" :size="size" :to="to">
    <span class="gt-md">{{ text }}</span>
    <q-tooltip :offset="[10, 10]" class="text-body2 lt-md">{{ text }}</q-tooltip>
  </q-btn>
</template>