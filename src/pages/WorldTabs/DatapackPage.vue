<script setup lang="ts">
import ContentsView from 'src/components/World/Contents/ContentsView.vue';
</script>

<template>
  <!-- <ContentsView
    type-name="データパック"
    :item-names="mainStore.world.additional.datapacks"
    :candidate-items="sysStore.cacheContents.datapacks"
  /> -->
  <ContentsView contentType="datapack" :candidate-items="[
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
  ]" />
</template>