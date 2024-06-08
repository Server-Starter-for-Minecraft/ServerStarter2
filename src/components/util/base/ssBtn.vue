<script setup lang="ts">
import { QBtnProps } from 'quasar';

interface Prop {
  freeWidth?: boolean;
  width?: string;
  isCapital?: boolean
  onClick: () => void;
}
const prop = defineProps<Prop & QBtnProps>();
</script>

<template>
  <q-btn
    v-bind="prop"
    outline
    :disable="loading || disable"
    :no-caps="!isCapital"
    :style="{ width: freeWidth ? '' : width ?? '13rem' }"
  >
    <slot />
  </q-btn>
</template>
