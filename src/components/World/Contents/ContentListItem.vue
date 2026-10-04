<script setup lang="ts">
import { computed } from 'vue';
import {
  AllFileData,
  DatapackData,
  ModData,
  PluginData,
} from 'app/src-electron/schema/filedata';
import { ContentType, useContentActions } from './contentActions';
import { toDisplayText } from './contentFilter';

type T = DatapackData | ModData | PluginData;

interface Prop {
  contentType: ContentType;
  content: AllFileData<T>;
  /** 導入済みのコンテンツとして表示する（削除ボタンを表示） */
  isDelete?: boolean;
}
const prop = defineProps<Prop>();

const { addContent, deleteContent } = useContentActions();

const name = computed(() => toDisplayText(prop.content.name));
const description = computed(() =>
  'description' in prop.content ? toDisplayText(prop.content.description) : ''
);
/** 拡張子（フォルダの場合はフォルダであることを示す） */
const fileLabel = computed(() =>
  prop.content.isFile ? prop.content.ext : 'folder'
);
</script>

<template>
  <!-- 名前を省略せずに表示し、たくさん導入した場合も一覧しやすいよう1行ずつ並べる -->
  <q-item dense class="q-px-sm content-item">
    <q-item-section>
      <q-item-label class="content-name">
        {{ name }}
        <span class="text-caption q-ml-xs" style="opacity: 0.5">
          {{ fileLabel }}
        </span>
      </q-item-label>
      <q-item-label v-if="description" caption class="content-desc">
        {{ description }}
      </q-item-label>
    </q-item-section>

    <q-item-section side>
      <q-btn
        v-if="isDelete"
        dense
        flat
        no-caps
        color="negative"
        icon="close"
        :label="$t('general.delete')"
        @click="deleteContent(contentType, content)"
      />
      <q-btn
        v-else
        dense
        flat
        no-caps
        color="primary"
        icon="add"
        :label="$t('additionalContents.install')"
        @click="addContent(contentType, content)"
      />
    </q-item-section>
  </q-item>
</template>

<style scoped lang="scss">
.content-name {
  font-size: 1rem;
  word-break: break-all;
}

.content-desc {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
