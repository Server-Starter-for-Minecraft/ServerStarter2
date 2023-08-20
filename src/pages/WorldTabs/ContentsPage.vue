<script setup lang="ts">
import { useContentsStore } from 'src/stores/WorldTabs/ContentsStore';
import ContentsView from 'src/components/World/Contents/ContentsView.vue';

const contentsStore = useContentsStore()
</script>

<template>
  <q-scroll-area
    class="full-height"
    style="flex: 1 1 0;"
  >
    <ContentsView :content-type="contentsStore.getShowingContentPage()" />
  </q-scroll-area>
</template>