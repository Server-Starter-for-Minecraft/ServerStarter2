<script setup lang="ts">
import { TranslationProps } from 'vue-i18n';

const prop = defineProps<TranslationProps>();
</script>

<template>
  <i18n-t v-bind="prop" scope="global">
    <slot />
  </i18n-t>
</template>
