<script setup lang="ts">
interface Prop {
  title: string;
}
defineProps<Prop>();
</script>

<template>
  <q-expansion-item
    :header-style="{ marginLeft: '-16px', fontSize: '1.2rem' }"
    :label="title"
  >
    <div class="q-pt-md">
      <slot />
    </div>
  </q-expansion-item>
</template>
