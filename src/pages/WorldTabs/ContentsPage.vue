<script setup lang="ts">
import { useContentsStore } from 'src/stores/WorldTabs/ContentsStore';
import CardView from 'src/components/World/Contents/CardView.vue';
import ListView from 'src/components/World/Contents/ListView.vue';

const contentsStore = useContentsStore();
</script>

<template>
  <q-scroll-area class="full-height" style="flex: 1 1 0">
    <CardView
      v-if="false"
      :content-type="contentsStore.getShowingContentPage()"
    />
    <ListView
      v-if="true"
      :content-type="contentsStore.getShowingContentPage()"
    />
  </q-scroll-area>
</template>
