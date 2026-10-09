<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import { useContentsStore } from 'src/stores/WorldTabs/ContentsStore';
import ContentsView from 'src/components/World/Contents/ContentsView.vue';

const mainStore = useMainStore();
const contentsStore = useContentsStore();
</script>

<template>
  <!-- スクロールはContentsView側で区画ごとに行う -->
  <div class="fit">
    <ContentsView
      v-if="mainStore.world"
      :content-type="
        contentsStore.getShowingContentPage(mainStore.world.version.type)
      "
    />
  </div>
</template>
