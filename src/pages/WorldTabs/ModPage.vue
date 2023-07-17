<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import ContentsView from 'src/components/World/Contents/ContentsView.vue';

const sysStore = useSystemStore()
const mainStore = useMainStore()
</script>

<template>
  <ContentsView contentType="mod" :item-names="mainStore.world.additional.mods"
    :candidate-items="sysStore.cacheContents.mods" />
</template>