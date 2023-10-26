<script setup lang="ts">
defineProps(['itemProps', 'label', 'description', 'icon'])
</script>

<template>
  <q-item v-bind="itemProps">
    <q-item-section avatar>
      <q-avatar size="2rem" square>
        <q-img :src="icon" />
      </q-avatar>
    </q-item-section>
    <q-item-section>
      <q-item-label>{{ label }}</q-item-label>
      <q-item-label caption style="opacity: .7;">{{ description }}</q-item-label>
    </q-item-section>
  </q-item>
</template>