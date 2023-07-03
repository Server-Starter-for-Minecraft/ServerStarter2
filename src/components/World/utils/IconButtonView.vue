<script setup lang="ts">
interface Prop {
  iconName: string
  label: string
  to?: string
  onClick?: () => void
}
defineProps<Prop>()
</script>

<template>
  <q-item clickable :to="to" @click="onClick">
    <q-item-section avatar>
      <q-icon :name="iconName" size="2rem" class="q-py-sm"/>
    </q-item-section>
    <q-item-section>
      <span style="font-size: 1rem;">{{ label }}</span>
    </q-item-section>
  </q-item>
</template>