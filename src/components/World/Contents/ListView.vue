<script setup lang="ts">
import { useContentsStore } from 'src/stores/WorldTabs/ContentsStore';
import SsIconBtn from 'src/components/util/base/ssIconBtn.vue';
import SsInput from 'src/components/util/base/ssInput.vue';
import {
  ContentsType,
  importNewContent,
  openSavedFolder,
} from './contentsPage';

interface Prop {
  contentType: ContentsType;
}
defineProps<Prop>();
const contentsStore = useContentsStore();
</script>

<template>
  <div class="q-px-md">
    <h1 class="q-py-xs">
      {{
        $t('additionalContents.management', {
          type: $t(`additionalContents.${contentType}`),
        })
      }}
    </h1>

    <div class="row items-center q-gutter-md">
      <SsInput
        v-model="contentsStore.searchText"
        dense
        placeholder="追加や絞り込みしたいコンテンツ名を入力"
        class="col"
      />
      <SsIconBtn
        flat
        size=".8rem"
        icon="library_add"
        tooltip="追加コンテンツのファイルを新規追加"
        @click="() => importNewContent(contentType, true)"
      />
      <SsIconBtn
        flat
        size=".8rem"
        icon="folder_open"
        tooltip="保存先フォルダを開く"
        @click="() => openSavedFolder(contentType)"
      />
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
