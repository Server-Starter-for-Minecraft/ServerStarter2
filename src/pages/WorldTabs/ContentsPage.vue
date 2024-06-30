<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import { useContentsStore } from 'src/stores/WorldTabs/ContentsStore';
import CardView from 'src/components/World/Contents/CardView.vue';
import ListView from 'src/components/World/Contents/ListView.vue';

const mainStore = useMainStore();
const contentsStore = useContentsStore();

// CardViewは廃止予定のため，表示させない
const cardViewSelector = false
</script>

<template>
  <q-scroll-area class="full-height" style="flex: 1 1 0">
    <CardView
      v-if="mainStore.world && cardViewSelector"
      :content-type="contentsStore.getShowingContentPage(mainStore.world.version.type)"
    />
    <ListView
      v-if="mainStore.world && !cardViewSelector"
      :content-type="contentsStore.getShowingContentPage(mainStore.world.version.type)"
    />
  </q-scroll-area>
</template>
