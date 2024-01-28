<script setup lang="ts">
interface Prop {
  url: string;
}
const prop = defineProps<Prop>();

function openURL() {
  window.API.sendOpenBrowser(prop.url);
}
</script>

<template>
  <a href="javascript:void(0)" class="text-primary" @click="openURL()">
    <slot />
  </a>
</template>
