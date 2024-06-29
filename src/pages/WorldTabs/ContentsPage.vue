<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import { useContentsStore } from 'src/stores/WorldTabs/ContentsStore';
import ContentsView from 'src/components/World/Contents/ContentsView.vue';

const mainStore = useMainStore();
const contentsStore = useContentsStore();
</script>

<template>
  <q-scroll-area class="full-height" style="flex: 1 1 0">
    <ContentsView
      v-if="mainStore.world"
      :content-type="
        contentsStore.getShowingContentPage(mainStore.world.version.type)
      "
    />
  </q-scroll-area>
</template>
