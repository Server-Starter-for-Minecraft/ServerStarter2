<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import ContentsView from 'src/components/World/Contents/ContentsView.vue';

const sysStore = useSystemStore()
const mainStore = useMainStore()
</script>

<template>
  <!-- <ContentsView
    type-name="データパック"
    :item-names="mainStore.world.additional.datapacks"
    :candidate-items="sysStore.cacheContents.datapacks"
  /> -->
  <ContentsView
    type="datapack"
    :item-names="mainStore.world.additional.datapacks"
    :candidate-items="[
      {
        kind: 'datapack',
        'description': 'これはテストデータパックこれはテストデータパック',
        'type': 'system',
        'name': 'testPack',
        'ext': '',
        'isFile': true,
      },
      {
        kind: 'datapack',
        'description': 'これはテストデータパック',
        'type': 'system',
        'name': 'testPack',
        'ext': '',
        'isFile': true,
      },
      {
        kind: 'datapack',
        'description': 'これはテストデータパック',
        'type': 'system',
        'name': 'testPack',
        'ext': '',
        'isFile': true,
      },
    ]"
  />
</template>