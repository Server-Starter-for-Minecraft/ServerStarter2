<script setup lang="ts">
import ContentsView from 'src/components/World/Contents/ContentsView.vue';

// TODO: これは最終的には導入経験のあるデータパック一覧をシステム設定より取得
// データパック名とそれらの説明文のセットをDatapackオブジェクトに格納されていてほしい
const oldDatapacks = [
  'testPack1',
  'testPack2',
  'testPack3',
  'testPack4',
]
</script>

<template>
  <ContentsView
    type="datapack"
    :item-names="['kusaPack1', 'kusaPack2']"
    :candidate-items="oldDatapacks"
  />
</template>