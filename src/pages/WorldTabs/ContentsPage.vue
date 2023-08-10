<script setup lang="ts">
import { useContentsStore } from 'src/stores/WorldTabs/ContentsStore';
import ContentsView from 'src/components/World/Contents/ContentsView.vue';

const contentsStore = useContentsStore()
</script>

<template>
  <ContentsView :content-type="contentsStore.getShowingContentPage()" />
</template>