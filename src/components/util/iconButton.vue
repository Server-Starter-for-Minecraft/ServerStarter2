<script setup lang="ts">
interface Props {
  icon: string
  text: string
  color?: string
  size?: string
  to?: string
  onClick?: (evt: Event) => void
}
defineProps<Props>()
</script>

<template>
  <q-btn flat :icon="icon" :color="color" :size="size" :to="to" @click="onClick">
    <span class="gt-md q-pl-sm">{{ text }}</span>
    <q-tooltip :offset="[10, 10]" class="lt-md" :style="{ 'font-size': size }">{{ text }}</q-tooltip>
  </q-btn>
</template>