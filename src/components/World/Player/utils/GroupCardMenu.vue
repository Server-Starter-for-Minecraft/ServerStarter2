<script setup lang="ts">
interface Prop {
  icon: string;
  text: string;
  onClick: () => void;
}
defineProps<Prop>();
</script>

<template>
  <q-item clickable v-close-popup class="q-my-xs" @click="onClick">
    <q-item-section avatar>
      <q-icon :name="icon" />
    </q-item-section>
    <q-item-section>{{ text }}</q-item-section>
  </q-item>
</template>
